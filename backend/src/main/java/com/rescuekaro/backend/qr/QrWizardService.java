package com.rescuekaro.backend.qr;

import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.emergency.EmergencyProfileDto;
import com.rescuekaro.backend.emergency.EmergencyProfileService;
import com.rescuekaro.backend.exception.ApiException;
import jakarta.validation.Validator;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class QrWizardService {
    private final JdbcClient db;
    private final ObjectMapper json;
    private final EmergencyProfileService profiles;
    private final QrCodeService qr;
    private final AppProperties properties;
    private final Validator validator;
    private final Environment environment;

    public QrWizardService(JdbcClient db, ObjectMapper json, EmergencyProfileService profiles,
                           QrCodeService qr, AppProperties properties, Validator validator, Environment environment) {
        this.db = db;
        this.json = json;
        this.profiles = profiles;
        this.qr = qr;
        this.properties = properties;
        this.validator = validator;
        this.environment = environment;
    }

    public record Delivery(String recipient, String phone, String line1, String line2, String landmark,
                           String city, String state, String pinCode, String country) {}
    public record Data(EmergencyProfileDto profile, String ambulanceNumber, String policeNumber,
                       String stickerType, Integer quantity, Delivery delivery, boolean confirmed) {}
    public record View(UUID draftId, int step, Data data, StickerOrder completedOrder) {}
    public record StickerOrder(UUID id, String stickerType, int quantity, String status, String paymentStatus,
                               Delivery delivery, Instant createdAt, List<QrCodeService.OwnerQr> stickers) {}
    private record Draft(UUID id, int step, Data data) {}

    @Transactional
    public View get(UUID userId) {
        Draft draft = draft(userId, true);
        if (draft == null) {
            EmergencyProfileDto existing = null;
            try { existing = profiles.get(userId); }
            catch (ApiException missing) { if (missing.status() != HttpStatus.NOT_FOUND) throw missing; }
            if (existing == null) existing = blankProfile(userId);
            Data data = new Data(existing, "", "", "", 1, blankDelivery(existing), false);
            db.sql("INSERT INTO qr_wizard_drafts(user_id,draft_id,step,payload) VALUES(:user,:id,1,CAST(:payload AS jsonb)) ON CONFLICT (user_id) DO NOTHING")
                    .param("user", userId).param("id", UUID.randomUUID()).param("payload", encode(data)).update();
            draft = draft(userId, true);
        }
        if (draft.step() < 6) {
            try {
                var saved = profiles.get(userId);
                var old = draft.data().profile();
                if (!java.util.Objects.equals(saved.version(), old.version()) || !java.util.Objects.equals(saved.id(), old.id())) {
                    var refreshed = new EmergencyProfileDto(saved.id(), saved.version(), old.fullName(), old.bloodGroup(), old.city(), old.state(),
                            old.dateOfBirth(), old.ageYears(), old.contacts(), old.medical(), old.address(), old.selections(),
                            old.publicEmergencyProfileAccepted(), old.updatedAt());
                    var data = new Data(refreshed, draft.data().ambulanceNumber(), draft.data().policeNumber(), draft.data().stickerType(),
                            draft.data().quantity(), draft.data().delivery(), draft.data().confirmed());
                    db.sql("UPDATE qr_wizard_drafts SET payload=CAST(:payload AS jsonb) WHERE user_id=:user")
                            .param("payload", encode(data)).param("user", userId).update();
                    draft = new Draft(draft.id(), draft.step(), data);
                }
            } catch (ApiException missing) { if (missing.status() != HttpStatus.NOT_FOUND) throw missing; }
        }
        return view(userId, draft);
    }

    @Transactional
    public View save(UUID userId, UUID draftId, int step, Data data) {
        Draft current = draft(userId, true);
        if (current == null || !current.id().equals(draftId)) throw stale();
        if (current.step() == 6) throw invalid("This sticker request is already complete. Start a new request.");
        if (step < 1 || step > 5) throw invalid("Choose a valid wizard step.");
        if (data == null || data.profile() == null) throw invalid("Enter your emergency details.");
        validateThrough(data, step - 1);
        db.sql("UPDATE qr_wizard_drafts SET step=:step,payload=CAST(:payload AS jsonb),updated_at=now() WHERE user_id=:user")
                .param("step", step).param("payload", encode(data)).param("user", userId).update();
        return new View(draftId, step, data, null);
    }

    @Transactional
    public View startNew(UUID userId) {
        Draft current = draft(userId, true);
        if (current == null) return get(userId);
        if (current.step() != 6) return view(userId, current);
        EmergencyProfileDto saved = profiles.get(userId);
        Data data = new Data(saved, current.data().ambulanceNumber(), current.data().policeNumber(),
                "", 1, blankDelivery(saved), false);
        UUID nextId = UUID.randomUUID();
        db.sql("UPDATE qr_wizard_drafts SET draft_id=:id,step=1,payload=CAST(:payload AS jsonb),updated_at=now() WHERE user_id=:user")
                .param("id", nextId).param("payload", encode(data)).param("user", userId).update();
        return new View(nextId, 1, data, null);
    }

    @Transactional
    public View finish(UUID userId, UUID draftId, Data data) {
        Draft current = draft(userId, true);
        if (current == null || !current.id().equals(draftId)) throw stale();
        StickerOrder previous = byDraft(userId, draftId);
        if (previous != null) return new View(draftId, 6, current.data(), previous);
        if (current.step() != 5) throw invalid("Complete the preview before generating stickers.");
        if (data == null || !data.confirmed()) throw invalid("Confirm the details before generating stickers.");
        validateThrough(data, 4);
        if (!Boolean.TRUE.equals(data.profile().publicEmergencyProfileAccepted()))
            throw invalid("Approve the public emergency profile before generation.");
        var violations = validator.validate(data.profile());
        if (!violations.isEmpty()) throw invalid("Please correct: " + violations.stream()
                .map(violation -> violation.getPropertyPath() + " " + violation.getMessage())
                .sorted().collect(java.util.stream.Collectors.joining("; ")));
        String origin = properties.publicAppUrl();
        boolean localDevelopment = environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev"))
                && !environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))
                && !"production".equalsIgnoreCase(environment.getProperty("APP_ENV", ""));
        if (!generationOriginAllowed(origin, localDevelopment))
            throw new ApiException(HttpStatus.CONFLICT, "PUBLIC_URL_REQUIRED",
                    "The public emergency site has not been configured yet. Your progress is saved; retry after setup is complete.");

        EmergencyProfileDto saved = profiles.save(userId, data.profile());
        db.sql("INSERT INTO profile_emergency_numbers(emergency_profile_id,ambulance_number,police_number) VALUES(:profile,:ambulance,:police) "
                + "ON CONFLICT (emergency_profile_id) DO UPDATE SET ambulance_number=EXCLUDED.ambulance_number,police_number=EXCLUDED.police_number,updated_at=now()")
                .param("profile", saved.id()).param("ambulance", cleanNumber(data.ambulanceNumber()))
                .param("police", cleanNumber(data.policeNumber())).update();
        Delivery delivery = data.delivery();
        UUID orderId = UUID.randomUUID();
        db.sql("INSERT INTO sticker_orders(id,wizard_draft_id,user_id,emergency_profile_id,sticker_type,quantity,recipient,delivery_phone,line1,line2,landmark,city,state,pin_code,country) "
                + "VALUES(:id,:draft,:user,:profile,:type,:quantity,:recipient,:phone,:line1,:line2,:landmark,:city,:state,:pin,:country)")
                .param("id", orderId).param("draft", draftId).param("user", userId).param("profile", saved.id())
                .param("type", data.stickerType()).param("quantity", data.quantity())
                .param("recipient", clean(delivery.recipient())).param("phone", AuthService.normalizePhone(delivery.phone()))
                .param("line1", clean(delivery.line1())).param("line2", clean(delivery.line2()))
                .param("landmark", clean(delivery.landmark())).param("city", clean(delivery.city()))
                .param("state", clean(delivery.state())).param("pin", clean(delivery.pinCode()))
                .param("country", clean(delivery.country())).update();
        for (int i = 0; i < data.quantity(); i++) {
            db.sql("INSERT INTO qr_codes(id,public_token,emergency_profile_id,sticker_order_id,sticker_serial,status,activated_at) "
                    + "VALUES(:id,:token,:profile,:order,nextval('sticker_serial_seq'),'ACTIVE',now())")
                    .param("id", UUID.randomUUID()).param("token", qr.randomPublicToken())
                    .param("profile", saved.id()).param("order", orderId).update();
        }
        Data completed = new Data(saved, data.ambulanceNumber(), data.policeNumber(), data.stickerType(),
                data.quantity(), delivery, true);
        db.sql("UPDATE qr_wizard_drafts SET step=6,payload=CAST(:payload AS jsonb),updated_at=now() WHERE user_id=:user")
                .param("payload", encode(completed)).param("user", userId).update();
        return new View(draftId, 6, completed, order(userId, orderId));
    }

    public List<StickerOrder> listOrders(UUID userId) {
        return db.sql("SELECT id FROM sticker_orders WHERE user_id=:user ORDER BY created_at DESC")
                .param("user", userId).query(UUID.class).list().stream().map(id -> order(userId, id)).toList();
    }

    public StickerOrder order(UUID userId, UUID orderId) {
        StickerOrder base = db.sql("SELECT id,sticker_type,quantity,status,payment_status,recipient,delivery_phone,line1,line2,landmark,city,state,pin_code,country,created_at "
                        + "FROM sticker_orders WHERE id=:id AND user_id=:user")
                .param("id", orderId).param("user", userId)
                .query((rs, n) -> new StickerOrder((UUID) rs.getObject("id"), rs.getString("sticker_type"),
                        rs.getInt("quantity"), rs.getString("status"), rs.getString("payment_status"),
                        new Delivery(rs.getString("recipient"), rs.getString("delivery_phone"), rs.getString("line1"),
                                rs.getString("line2"), rs.getString("landmark"), rs.getString("city"), rs.getString("state"),
                                rs.getString("pin_code"), rs.getString("country")), rs.getTimestamp("created_at").toInstant(), List.of()))
                .optional().orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "Sticker request not found."));
        List<QrCodeService.OwnerQr> stickers = db.sql("SELECT id FROM qr_codes WHERE sticker_order_id=:order ORDER BY sticker_serial")
                .param("order", orderId).query(UUID.class).list().stream().map(id -> qr.owned(userId, id)).toList();
        return new StickerOrder(base.id(), base.stickerType(), base.quantity(), base.status(), base.paymentStatus(),
                base.delivery(), base.createdAt(), stickers);
    }

    private StickerOrder byDraft(UUID userId, UUID draftId) {
        UUID id = db.sql("SELECT id FROM sticker_orders WHERE user_id=:user AND wizard_draft_id=:draft")
                .param("user", userId).param("draft", draftId).query(UUID.class).optional().orElse(null);
        return id == null ? null : order(userId, id);
    }

    private View view(UUID userId, Draft draft) {
        return new View(draft.id(), draft.step(), draft.data(), draft.step() == 6 ? byDraft(userId, draft.id()) : null);
    }

    private Draft draft(UUID userId, boolean lock) {
        String sql = "SELECT draft_id,step,payload::text FROM qr_wizard_drafts WHERE user_id=:user" + (lock ? " FOR UPDATE" : "");
        return db.sql(sql).param("user", userId).query((rs, n) -> new Draft((UUID) rs.getObject("draft_id"),
                rs.getInt("step"), decode(rs.getString(3)))).optional().orElse(null);
    }

    private EmergencyProfileDto blankProfile(UUID userId) {
        String name = db.sql("SELECT full_name FROM users WHERE id=:user")
                .param("user", userId).query(String.class).single();
        return new EmergencyProfileDto(null, null, name, "", "", "", null, null,
                List.of(new EmergencyProfileDto.Contact(null, "", "", "", true)),
                new EmergencyProfileDto.Medical("", "", "", ""),
                new EmergencyProfileDto.Address("", "", "", "", "", "", "India"),
                new EmergencyProfileDto.Selections(false, false, false, true, true, true, true, true), true, null);
    }

    private static Delivery blankDelivery(EmergencyProfileDto profile) {
        var address = profile.address();
        return new Delivery(profile.fullName(), "", address.line1(), address.line2(), address.landmark(),
                address.city(), address.state(), address.pinCode(), "India");
    }

    private static void validateThrough(Data data, int lastStep) {
        EmergencyProfileDto profile = data.profile();
        if (profile == null) throw invalid("Enter your emergency profile.");
        if (lastStep >= 1 && (clean(profile.fullName()).length() < 2 || clean(profile.fullName()).length() > 100
                || profile.bloodGroup() == null || !Set.of("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-").contains(profile.bloodGroup())
                || profile.medical() == null || profile.selections() == null)) throw invalid("Enter a full name and blood group.");
        if (lastStep >= 1) {
            if (profile.ageYears() != null && (profile.ageYears() < 0 || profile.ageYears() > 120)
                    || profile.dateOfBirth() != null && profile.dateOfBirth().isAfter(java.time.LocalDate.now()))
                throw invalid("Enter an age from 0 to 120 and a date of birth that is not in the future, or leave them blank.");
            var medical = profile.medical();
            if (clean(medical.allergies()).length() > 500 || clean(medical.condition()).length() > 500
                    || clean(medical.medication()).length() > 500 || clean(medical.note()).length() > 500)
                throw invalid("Each medical detail must be no longer than 500 characters.");
        }
        if (lastStep >= 2) {
            var contacts = profile.contacts();
            if (contacts == null || contacts.isEmpty() || contacts.size() > 5 || contacts.stream().anyMatch(java.util.Objects::isNull)
                    || contacts.stream().filter(EmergencyProfileDto.Contact::primary).count() != 1)
                throw invalid("Add one to five contacts and choose one primary contact.");
            Set<String> phones = new HashSet<>();
            for (var contact : contacts) {
                if (clean(contact.name()).length() < 2 || clean(contact.name()).length() > 100
                        || clean(contact.relationship()).isBlank() || clean(contact.relationship()).length() > 30
                        || !phones.add(AuthService.normalizePhone(contact.phone())))
                    throw invalid("Enter each contact's name, relationship, and a different valid phone number.");
            }
        }
        if (lastStep >= 3) {
            var address = profile.address();
            if (address == null || clean(address.line1()).isBlank() || clean(address.city()).length() < 2
                    || clean(address.state()).length() < 2 || !clean(address.pinCode()).matches("\\d{6}"))
                throw invalid("Enter a complete address, city, state, and six-digit postal code.");
            if (clean(address.line1()).length() > 200 || clean(address.line2()).length() > 200
                    || clean(address.landmark()).length() > 200 || clean(address.city()).length() > 100
                    || clean(address.state()).length() > 100)
                throw invalid("Address lines must be at most 200 characters, and city/state at most 100.");
            cleanNumber(data.ambulanceNumber());
            cleanNumber(data.policeNumber());
        }
        if (lastStep >= 4) {
            if (data.stickerType() == null || !Set.of("HELMET", "CAR", "MOBILE_BAG").contains(data.stickerType())
                    || data.quantity() == null || data.quantity() < 1 || data.quantity() > 10)
                throw invalid("Choose a sticker type and quantity from 1 to 10.");
            var delivery = data.delivery();
            if (delivery == null || clean(delivery.recipient()).length() < 2 || clean(delivery.line1()).isBlank()
                    || clean(delivery.city()).length() < 2 || clean(delivery.state()).length() < 2
                    || !clean(delivery.pinCode()).matches("\\d{6}") || !"India".equalsIgnoreCase(clean(delivery.country())))
                throw invalid("Enter a complete delivery address in India.");
            if (clean(delivery.recipient()).length() > 100 || clean(delivery.line1()).length() > 200
                    || clean(delivery.line2()).length() > 200 || clean(delivery.landmark()).length() > 200
                    || clean(delivery.city()).length() > 100 || clean(delivery.state()).length() > 100)
                throw invalid("Delivery fields exceed their allowed lengths.");
            AuthService.normalizePhone(delivery.phone());
        }
    }

    private static String cleanNumber(String raw) {
        String number = raw == null ? "" : raw.replaceAll("[\\s()-]", "");
        if (!number.isEmpty() && !number.matches("\\+?\\d{3,15}"))
            throw invalid("Enter a valid emergency helpline number or leave it blank.");
        return number;
    }
    private static String clean(String raw) { return raw == null ? "" : raw.trim(); }
    static boolean generationOriginAllowed(String origin, boolean localDevelopment) {
        if (localDevelopment) {
            try {
                var uri = java.net.URI.create(origin);
                if (("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                        && Set.of("localhost", "127.0.0.1", "[::1]", "::1").contains(uri.getHost())
                        && uri.getRawUserInfo() == null && uri.getRawQuery() == null && uri.getRawFragment() == null
                        && (uri.getPath().isEmpty() || "/".equals(uri.getPath()))) return true;
            } catch (RuntimeException invalid) { return false; }
        }
        try {
            var uri = java.net.URI.create(origin);
            String host = uri.getHost();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null || uri.getRawUserInfo() != null
                    || uri.getRawQuery() != null || uri.getRawFragment() != null
                    || !(uri.getPath().isEmpty() || "/".equals(uri.getPath()))) return false;
            host = host.toLowerCase(java.util.Locale.ROOT);
            if (host.equals("localhost") || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".invalid")
                    || host.equals("[::1]") || host.equals("::1") || host.equals("0.0.0.0")) return false;
            if (host.matches("\\d+\\.\\d+\\.\\d+\\.\\d+")) {
                String[] octets = host.split("\\.");
                int first = Integer.parseInt(octets[0]), second = Integer.parseInt(octets[1]);
                if (first == 127 || first == 10 || (first == 192 && second == 168)
                        || (first == 172 && second >= 16 && second <= 31)) return false;
            }
            return true;
        } catch (RuntimeException invalid) { return false; }
    }
    private String encode(Data data) {
        try { return json.writeValueAsString(data); }
        catch (JacksonException failure) { throw new IllegalStateException("Could not save wizard progress.", failure); }
    }
    private Data decode(String data) {
        try { return json.readValue(data, Data.class); }
        catch (JacksonException failure) { throw new IllegalStateException("Could not load wizard progress.", failure); }
    }
    private static ApiException invalid(String message) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", message);
    }
    private static ApiException stale() {
        return new ApiException(HttpStatus.CONFLICT, "STALE_WIZARD", "Wizard progress changed. Reload and try again.");
    }
}
