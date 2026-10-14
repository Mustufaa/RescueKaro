package com.rescuekaro.backend.qr;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.imageio.ImageIO;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.rescuekaro.backend.configuration.AppProperties;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.security.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.env.Environment;
import jakarta.annotation.PostConstruct;

@Service
public class QrCodeService {
    private final JdbcClient db; private final TokenService tokens; private final AppProperties properties;private final Environment environment;
    public QrCodeService(JdbcClient db,TokenService tokens,AppProperties properties,Environment environment){this.db=db;this.tokens=tokens;this.properties=properties;this.environment=environment;}
    @PostConstruct public void validatePublicUrl(){if((java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod")||"production".equalsIgnoreCase(environment.getProperty("APP_ENV","")))&&!properties.publicAppUrl().startsWith("https://"))throw new IllegalStateException("Production APP_PUBLIC_BASE_URL must use HTTPS.");}

    public List<OwnerQr> list(UUID userId){
        return db.sql("SELECT q.id,q.serial_number,q.sticker_serial,q.status,q.public_token,q.created_at FROM qr_codes q JOIN emergency_profiles p ON p.id=q.emergency_profile_id WHERE p.user_id=:user ORDER BY q.created_at DESC,q.serial_number DESC")
                .param("user",userId).query((rs,n)->ownerQr(rs)).list();
    }

    @Transactional
    public OwnerQr createDigital(UUID userId) {
        boolean localDevelopment = environment.acceptsProfiles(org.springframework.core.env.Profiles.of("dev"))
                && !environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))
                && !"production".equalsIgnoreCase(environment.getProperty("APP_ENV", ""));
        if (!QrWizardService.generationOriginAllowed(properties.publicAppUrl(), localDevelopment))
            throw new ApiException(HttpStatus.CONFLICT, "PUBLIC_URL_REQUIRED", "Configure the public emergency site before generating a QR.");
        UUID profileId = db.sql("SELECT id FROM emergency_profiles WHERE user_id=:user AND public_profile_consent_at IS NOT NULL FOR UPDATE")
                .param("user", userId).query(UUID.class).optional()
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "PROFILE_REQUIRED", "Save and approve your emergency profile first."));
        UUID existing = db.sql("SELECT id FROM qr_codes WHERE emergency_profile_id=:profile AND order_id IS NULL AND sticker_order_id IS NULL AND status='ACTIVE' ORDER BY created_at LIMIT 1")
                .param("profile", profileId).query(UUID.class).optional().orElse(null);
        if (existing != null) return owned(userId, existing);
        UUID id = UUID.randomUUID();
        db.sql("INSERT INTO qr_codes(id,public_token,emergency_profile_id,status,activated_at) VALUES(:id,:token,:profile,'ACTIVE',now())")
                .param("id", id).param("token", tokens.randomToken(32)).param("profile", profileId).update();
        return owned(userId, id);
    }

    public String randomPublicToken() { return tokens.randomToken(32); }

    public OwnerQr owned(UUID userId,UUID qrId){
        return db.sql("SELECT q.id,q.serial_number,q.sticker_serial,q.status,q.public_token,q.created_at FROM qr_codes q JOIN emergency_profiles p ON p.id=q.emergency_profile_id WHERE p.user_id=:user AND q.id=:id")
                .param("user",userId).param("id",qrId).query((rs,n)->ownerQr(rs))
                .optional().orElseThrow(()->notFound());
    }

    public byte[] png(UUID userId,UUID qrId){
        String url=owned(userId,qrId).publicUrl();
        try{
            BitMatrix matrix=new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE,512,512);
            BufferedImage image=MatrixToImageWriter.toBufferedImage(matrix); ByteArrayOutputStream output=new ByteArrayOutputStream();
            ImageIO.write(image,"PNG",output); return output.toByteArray();
        }catch(Exception e){throw new IllegalStateException("Unable to generate QR image",e);}
    }

    public PublicProfile resolve(String publicToken){ return resolve(null, publicToken); }

    public PublicProfile resolve(String serialCode,String publicToken){
        PublicRow row=db.sql("SELECT q.status,q.serial_number,q.sticker_serial,q.created_at AS qr_created_at,p.* FROM qr_codes q JOIN emergency_profiles p ON p.id=q.emergency_profile_id WHERE q.public_token=:token")
                .param("token",publicToken).query((rs,n)->new PublicRow((UUID)rs.getObject("id"),rs.getString("status"),rs.getLong("serial_number"),rs.getObject("sticker_serial")==null?null:rs.getLong("sticker_serial"),rs.getTimestamp("qr_created_at").toInstant(),rs.getString("full_name"),rs.getString("blood_group"),
                        rs.getString("city"),rs.getString("state"),rs.getDate("date_of_birth")==null?null:rs.getDate("date_of_birth").toLocalDate(),rs.getObject("age_years")==null?null:rs.getInt("age_years"),
                        rs.getString("allergies"),rs.getString("medical_condition"),rs.getString("medication"),rs.getString("emergency_note"),rs.getString("line1"),rs.getString("line2"),rs.getString("landmark"),
                        rs.getString("address_city"),rs.getString("address_state"),rs.getString("pin_code"),rs.getString("country"),
                        rs.getBoolean("show_dob"),rs.getBoolean("show_age"),rs.getBoolean("show_address"),rs.getBoolean("show_allergies"),rs.getBoolean("show_medication"),
                        rs.getBoolean("show_emergency_note"),rs.getBoolean("show_additional_contacts"),rs.getBoolean("show_emergency_services"),rs.getTimestamp("public_profile_consent_at")!=null))
                .optional().orElseThrow(()->notFound());
        String expectedSerial=row.stickerSerial()==null?QrIdentity.serialCode(row.serialNumber(),row.createdAt()):row.stickerSerial().toString();
        if(serialCode!=null && !expectedSerial.equals(serialCode)) throw notFound();
        if(java.util.Set.of("REVOKED","REPLACED").contains(row.status())) throw new ApiException(HttpStatus.GONE,"QR_INACTIVE","This RescueKaro sticker is no longer active.");
        if(!"ACTIVE".equals(row.status())||!row.consent()) throw notFound();
        List<PublicContact> all=db.sql("SELECT name,relationship,phone_e164,is_primary FROM emergency_contacts WHERE emergency_profile_id=:id ORDER BY sort_order")
                .param("id",row.profileId()).query((rs,n)->new PublicContact(rs.getString("name"),rs.getString("relationship"),rs.getString("phone_e164"),rs.getBoolean("is_primary"))).list();
        List<PublicContact> contacts=all.stream().filter(c->c.primary()||row.showAdditional()).toList();
        Map<String,String> medical=new LinkedHashMap<>();
        if(!row.condition().isBlank())medical.put("medicalCondition",row.condition());
        if(row.showAllergies()&&!row.allergies().isBlank())medical.put("allergies",row.allergies());
        if(row.showMedication()&&!row.medication().isBlank())medical.put("medication",row.medication());
        if(row.showNote()&&!row.note().isBlank())medical.put("emergencyNote",row.note());
        PublicAddress address=row.showAddress()?new PublicAddress(row.line1(),row.line2(),row.landmark(),row.addressCity(),row.addressState(),row.pin(),row.country()):null;
        LocalDate dob=row.showDob()?row.dob():null; Integer age=row.showAge()?(row.dob()!=null?Period.between(row.dob(),LocalDate.now()).getYears():row.ageYears()):null;
        List<DirectoryNumber> directory=new ArrayList<>();
        if(row.showServices()) {
            directory.addAll(directory(row.country(),row.state(),row.city()));
            db.sql("SELECT ambulance_number,police_number FROM profile_emergency_numbers WHERE emergency_profile_id=:id")
                    .param("id",row.profileId()).query((rs,n)->{
                        String ambulance=rs.getString("ambulance_number"),police=rs.getString("police_number");
                        if(!ambulance.isBlank())directory.add(new DirectoryNumber("Ambulance",ambulance,"Provided by profile owner",null));
                        if(!police.isBlank())directory.add(new DirectoryNumber("Police",police,"Provided by profile owner",null));
                        return 0;
                    }).optional();
        }
        return new PublicProfile(row.status(),row.name(),row.blood(),row.city(),dob,age,contacts,Map.copyOf(medical),address,directory);
    }

    private List<DirectoryNumber> directory(String country,String state,String city){
        return db.sql("SELECT label,phone_number,source_name,last_verified_at FROM emergency_directory_entries WHERE active=true AND verified=true AND last_verified_at IS NOT NULL AND lower(country)=lower(:country) AND (city='' OR lower(city)=lower(:city)) AND (state='' OR lower(state)=lower(:state)) ORDER BY city DESC,state DESC,label")
                .param("country",country).param("state",state).param("city",city)
                .query((rs,n)->new DirectoryNumber(rs.getString("label"),rs.getString("phone_number"),rs.getString("source_name"),rs.getTimestamp("last_verified_at").toInstant())).list();
    }

    private OwnerQr ownerQr(java.sql.ResultSet rs) throws java.sql.SQLException {
        long number=rs.getLong("serial_number");
        java.time.Instant createdAt=rs.getTimestamp("created_at").toInstant();
        Long stickerSerial=rs.getObject("sticker_serial")==null?null:rs.getLong("sticker_serial");
        String code=stickerSerial==null?QrIdentity.serialCode(number,createdAt):stickerSerial.toString();
        String url=stickerSerial==null?QrIdentity.publicUrl(properties.publicAppUrl(),number,createdAt,rs.getString("public_token"))
                :QrIdentity.publicUrl(properties.publicAppUrl(),stickerSerial,rs.getString("public_token"));
        return new OwnerQr((UUID)rs.getObject("id"),stickerSerial==null?number:stickerSerial,code,rs.getString("status"),url,createdAt);
    }
    private static ApiException notFound(){return new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","QR code not found.");}
    public record OwnerQr(UUID id,long serialNumber,String serialCode,String status,String publicUrl,java.time.Instant createdAt){}
    public record PublicContact(String name,String relationship,String phone,boolean primary){}
    public record PublicAddress(String line1,String line2,String landmark,String city,String state,String pinCode,String country){}
    public record DirectoryNumber(String label,String number,String source,java.time.Instant lastVerified){}
    public record PublicProfile(String stickerState,String displayName,String bloodGroup,String city,LocalDate dateOfBirth,Integer age,
                                List<PublicContact> contacts,Map<String,String> medical,PublicAddress address,List<DirectoryNumber> emergencyDirectory){}
    private record PublicRow(UUID profileId,String status,long serialNumber,Long stickerSerial,java.time.Instant createdAt,String name,String blood,String city,String state,LocalDate dob,Integer ageYears,String allergies,String condition,String medication,String note,
                             String line1,String line2,String landmark,String addressCity,String addressState,String pin,String country,
                             boolean showDob,boolean showAge,boolean showAddress,boolean showAllergies,boolean showMedication,boolean showNote,boolean showAdditional,boolean showServices,boolean consent){}
}
