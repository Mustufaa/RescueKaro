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
    @PostConstruct public void validatePublicUrl(){if((java.util.Arrays.asList(environment.getActiveProfiles()).contains("prod")||"production".equalsIgnoreCase(environment.getProperty("APP_ENV","")))&&!properties.publicAppUrl().startsWith("https://"))throw new IllegalStateException("Production PUBLIC_APP_URL must use HTTPS.");}

    public List<OwnerQr> list(UUID userId){
        return db.sql("SELECT q.id,q.serial_number,q.status,q.public_token,q.created_at FROM qr_codes q JOIN emergency_profiles p ON p.id=q.emergency_profile_id WHERE p.user_id=:user ORDER BY q.serial_number")
                .param("user",userId).query((rs,n)->ownerQr(rs)).list();
    }

    public OwnerQr owned(UUID userId,UUID qrId){
        return db.sql("SELECT q.id,q.serial_number,q.status,q.public_token,q.created_at FROM qr_codes q JOIN emergency_profiles p ON p.id=q.emergency_profile_id WHERE p.user_id=:user AND q.id=:id")
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
        PublicRow row=db.sql("SELECT q.status,q.serial_number,q.created_at AS qr_created_at,p.* FROM qr_codes q JOIN emergency_profiles p ON p.id=q.emergency_profile_id WHERE q.public_token=:token")
                .param("token",publicToken).query((rs,n)->new PublicRow((UUID)rs.getObject("id"),rs.getString("status"),rs.getLong("serial_number"),rs.getTimestamp("qr_created_at").toInstant(),rs.getString("full_name"),rs.getString("blood_group"),
                        rs.getString("city"),rs.getString("state"),rs.getDate("date_of_birth")==null?null:rs.getDate("date_of_birth").toLocalDate(),rs.getObject("age_years")==null?null:rs.getInt("age_years"),
                        rs.getString("allergies"),rs.getString("medication"),rs.getString("emergency_note"),rs.getString("line1"),rs.getString("line2"),rs.getString("landmark"),
                        rs.getString("address_city"),rs.getString("address_state"),rs.getString("pin_code"),rs.getString("country"),
                        rs.getBoolean("show_dob"),rs.getBoolean("show_age"),rs.getBoolean("show_address"),rs.getBoolean("show_allergies"),rs.getBoolean("show_medication"),
                        rs.getBoolean("show_emergency_note"),rs.getBoolean("show_additional_contacts"),rs.getBoolean("show_emergency_services"),rs.getTimestamp("public_profile_consent_at")!=null))
                .optional().orElseThrow(()->notFound());
        if(serialCode!=null && !QrIdentity.serialCode(row.serialNumber(),row.createdAt()).equals(serialCode)) throw notFound();
        if(java.util.Set.of("REVOKED","REPLACED").contains(row.status())) throw new ApiException(HttpStatus.GONE,"QR_INACTIVE","This RescueKaro sticker is no longer active.");
        if(!"ACTIVE".equals(row.status())||!row.consent()) throw notFound();
        List<PublicContact> all=db.sql("SELECT name,relationship,phone_e164,is_primary FROM emergency_contacts WHERE emergency_profile_id=:id ORDER BY sort_order")
                .param("id",row.profileId()).query((rs,n)->new PublicContact(rs.getString("name"),rs.getString("relationship"),rs.getString("phone_e164"),rs.getBoolean("is_primary"))).list();
        List<PublicContact> contacts=all.stream().filter(c->c.primary()||row.showAdditional()).toList();
        Map<String,String> medical=new LinkedHashMap<>();
        if(row.showAllergies()&&!row.allergies().isBlank())medical.put("allergies",row.allergies());
        if(row.showMedication()&&!row.medication().isBlank())medical.put("medication",row.medication());
        if(row.showNote()&&!row.note().isBlank())medical.put("emergencyNote",row.note());
        PublicAddress address=row.showAddress()?new PublicAddress(row.line1(),row.line2(),row.landmark(),row.addressCity(),row.addressState(),row.pin(),row.country()):null;
        LocalDate dob=row.showDob()?row.dob():null; Integer age=row.showAge()?(row.dob()!=null?Period.between(row.dob(),LocalDate.now()).getYears():row.ageYears()):null;
        List<DirectoryNumber> directory=row.showServices()?directory(row.country(),row.state(),row.city()):List.of();
        return new PublicProfile(row.status(),row.name(),row.blood(),row.city(),dob,age,contacts,Map.copyOf(medical),address,directory);
    }

    private List<DirectoryNumber> directory(String country,String state,String city){
        return db.sql("SELECT label,phone_number,source_name,last_verified_at FROM emergency_directory_entries WHERE active=true AND verified=true AND last_verified_at IS NOT NULL AND lower(country)=lower(:country) AND (city='' OR lower(city)=lower(:city)) AND (state='' OR lower(state)=lower(:state)) ORDER BY city DESC,state DESC,label")
                .param("country",country).param("state",state).param("city",city)
                .query((rs,n)->new DirectoryNumber(rs.getString("label"),rs.getString("phone_number"),rs.getString("source_name"),rs.getTimestamp("last_verified_at").toInstant())).list();
    }

    @Transactional
    public List<OwnerQr> activateForPaidOrder(UUID orderId){
        Allocation row=db.sql("SELECT o.user_id,o.emergency_profile_id,oi.id AS item_id,(oi.quantity*oi.sticker_count_each) AS stickers,o.payment_status FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE o.id=:id FOR UPDATE OF o")
                .param("id",orderId).query((rs,n)->new Allocation((UUID)rs.getObject("user_id"),(UUID)rs.getObject("emergency_profile_id"),(UUID)rs.getObject("item_id"),rs.getInt("stickers"),rs.getString("payment_status")))
                .optional().orElseThrow(()->notFound());
        if(!"PAID".equals(row.paymentStatus()))throw new ApiException(HttpStatus.CONFLICT,"PAYMENT_NOT_VERIFIED","Payment must be verified before sticker activation.");
        long existing=db.sql("SELECT count(*) FROM qr_codes WHERE order_id=:id").param("id",orderId).query(Long.class).single();
        if(existing==0){
            for(int i=0;i<row.stickers();i++) db.sql("INSERT INTO qr_codes(public_token,emergency_profile_id,order_id,order_item_id,status,activated_at) VALUES(:token,:profile,:order,:item,'ACTIVE',now())")
                    .param("token",tokens.randomToken(32)).param("profile",row.profileId()).param("order",orderId).param("item",row.itemId()).update();
        }else if(existing!=row.stickers()) throw new ApiException(HttpStatus.CONFLICT,"STICKER_ALLOCATION_INCONSISTENT","Sticker allocation needs operator review.");
        return list(row.userId());
    }

    private OwnerQr ownerQr(java.sql.ResultSet rs) throws java.sql.SQLException {
        long number=rs.getLong("serial_number");
        java.time.Instant createdAt=rs.getTimestamp("created_at").toInstant();
        return new OwnerQr((UUID)rs.getObject("id"),number,QrIdentity.serialCode(number,createdAt),rs.getString("status"),
                QrIdentity.publicUrl(properties.publicAppUrl(),number,createdAt,rs.getString("public_token")),createdAt);
    }
    private static ApiException notFound(){return new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","QR code not found.");}
    public record OwnerQr(UUID id,long serialNumber,String serialCode,String status,String publicUrl,java.time.Instant createdAt){}
    public record PublicContact(String name,String relationship,String phone,boolean primary){}
    public record PublicAddress(String line1,String line2,String landmark,String city,String state,String pinCode,String country){}
    public record DirectoryNumber(String label,String number,String source,java.time.Instant lastVerified){}
    public record PublicProfile(String stickerState,String displayName,String bloodGroup,String city,LocalDate dateOfBirth,Integer age,
                                List<PublicContact> contacts,Map<String,String> medical,PublicAddress address,List<DirectoryNumber> emergencyDirectory){}
    private record Allocation(UUID userId,UUID profileId,UUID itemId,int stickers,String paymentStatus){}
    private record PublicRow(UUID profileId,String status,long serialNumber,java.time.Instant createdAt,String name,String blood,String city,String state,LocalDate dob,Integer ageYears,String allergies,String medication,String note,
                             String line1,String line2,String landmark,String addressCity,String addressState,String pin,String country,
                             boolean showDob,boolean showAge,boolean showAddress,boolean showAllergies,boolean showMedication,boolean showNote,boolean showAdditional,boolean showServices,boolean consent){}
}
