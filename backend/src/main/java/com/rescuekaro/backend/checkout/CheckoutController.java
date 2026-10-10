package com.rescuekaro.backend.checkout;

import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.dto.ApiResponse;
import com.rescuekaro.backend.exception.ApiException;
import com.rescuekaro.backend.security.TokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.springframework.security.core.Authentication;

@RestController @RequestMapping("/api/v1")
public class CheckoutController {
  private final JdbcClient db; private final PasswordEncoder passwords; private final Environment env; private final ObjectMapper json;
  public CheckoutController(JdbcClient db, PasswordEncoder passwords, Environment env, ObjectMapper json) { this.db=db; this.passwords=passwords; this.env=env; this.json=json; }

  @PostMapping("/checkout/orders") @Transactional
  public ApiResponse<OrderView> create(@Valid @RequestBody Checkout r, Authentication authentication) {
    UUID user=UUID.fromString(authentication.getName());
    UUID profile=saveProfile(user,r.profile()); int profileVersion=db.sql("SELECT version FROM emergency_profiles WHERE id=:id").param("id",profile).query(Integer.class).single();
    var quote=db.sql("SELECT id,charge_paise,available,expires_at FROM shipping_quotes WHERE id=:id AND product_id=(SELECT id FROM products WHERE slug='starter-kit') AND pin_code=:pin AND country=:country AND quantity=1")
      .param("id",r.shippingQuoteId()).param("pin",r.delivery().pinCode()).param("country",r.delivery().country()).query((rs,n)->new Quote((UUID)rs.getObject(1),rs.getInt(2),rs.getBoolean(3),rs.getTimestamp(4).toInstant())).optional().orElseThrow(()->bad("Shipping quote is invalid; calculate delivery again."));
    if(!quote.available()||quote.expires().isBefore(Instant.now())) throw bad("Delivery is unavailable or the shipping quote expired.");
    var prod=db.sql("SELECT id,name,price_paise,sticker_count FROM products WHERE slug='starter-kit' AND active=true").query((rs,n)->new Product((UUID)rs.getObject(1),rs.getString(2),rs.getInt(3),rs.getInt(4))).single();
    UUID id=UUID.randomUUID(); String number="RK-"+UUID.randomUUID().toString().substring(0,8).toUpperCase(Locale.ROOT); int total=prod.price()+quote.charge();
    db.sql("INSERT INTO orders(id,order_number,user_id,product_id,shipping_quote_id,use_case,quantity,unit_price_paise,subtotal_paise,shipping_paise,total_paise,recipient,delivery_phone,line1,line2,landmark,city,state,pin_code,country,emergency_profile_id,emergency_profile_version,public_profile_consent_at,internet_required_accepted_at) VALUES(:id,:number,:user,:product,:quote,:usecase,1,:price,:price,:shipping,:total,:recipient,:phone,:line1,:line2,:landmark,:city,:state,:pin,:country,:profile,:version,now(),now())")
      .params(params("id",id,"number",number,"user",user,"product",prod.id(),"quote",quote.id(),"usecase",r.useCase(),"price",prod.price(),"shipping",quote.charge(),"total",total,"recipient",r.delivery().recipient(),"phone",AuthService.normalizePhone(r.delivery().phone()),"line1",r.delivery().line1(),"line2",nullToEmpty(r.delivery().line2()),"landmark",nullToEmpty(r.delivery().landmark()),"city",r.delivery().city(),"state",r.delivery().state(),"pin",r.delivery().pinCode(),"country",r.delivery().country(),"profile",profile,"version",profileVersion)).update();
    UUID item=UUID.randomUUID(); db.sql("INSERT INTO order_items(id,order_id,product_id,product_name,quantity,sticker_count_each,unit_price_paise,total_paise) VALUES(:id,:order,:product,:name,1,:stickers,:price,:price)").params(Map.of("id",item,"order",id,"product",prod.id(),"name",prod.name(),"stickers",prod.stickers(),"price",prod.price())).update();
    return ApiResponse.of(new OrderView(id,number,"PENDING",total,"INR",r.useCase(),prod.name(),quote.charge(),profile));
  }

  private UUID saveProfile(UUID user, Profile p){
    var id=db.sql("SELECT id FROM emergency_profiles WHERE user_id=:user").param("user",user).query(UUID.class).optional().orElse(null); int version=id==null?1:db.sql("SELECT version+1 FROM emergency_profiles WHERE id=:id").param("id",id).query(Integer.class).single();
    if(id==null)id=UUID.randomUUID(); else db.sql("DELETE FROM emergency_contacts WHERE emergency_profile_id=:id").param("id",id).update();
    if(p.contacts()==null||p.contacts().isEmpty()||p.contacts().size()>5||p.contacts().stream().filter(Contact::primary).count()!=1)throw bad("Provide one to five contacts and exactly one primary contact.");
    Set<String> uniquePhones=new HashSet<>(); for(Contact c:p.contacts())if(!uniquePhones.add(AuthService.normalizePhone(c.phone())))throw bad("Emergency contact phone numbers must be unique.");
    var a=p.address();var m=p.medical();var s=p.selections();
    db.sql("INSERT INTO emergency_profiles(id,user_id,version,full_name,blood_group,city,state,date_of_birth,age_years,allergies,medical_condition,medication,emergency_note,line1,line2,landmark,address_city,address_state,pin_code,country,show_dob,show_age,show_address,show_allergies,show_medication,show_emergency_note,show_additional_contacts,show_emergency_services,public_profile_consent_at) VALUES(:id,:user,:version,:name,:blood,:city,:state,:dob,:age,:allergies,:condition,:medication,:note,:line1,:line2,:landmark,:acity,:astate,:pin,:country,:dobv,:agev,:addressv,:allergiesv,:medicationv,:notev,:additionalv,:servicesv,now()) ON CONFLICT(id) DO UPDATE SET version=EXCLUDED.version,full_name=EXCLUDED.full_name,blood_group=EXCLUDED.blood_group,city=EXCLUDED.city,state=EXCLUDED.state,date_of_birth=EXCLUDED.date_of_birth,age_years=EXCLUDED.age_years,allergies=EXCLUDED.allergies,medical_condition=EXCLUDED.medical_condition,medication=EXCLUDED.medication,emergency_note=EXCLUDED.emergency_note,line1=EXCLUDED.line1,line2=EXCLUDED.line2,landmark=EXCLUDED.landmark,address_city=EXCLUDED.address_city,address_state=EXCLUDED.address_state,pin_code=EXCLUDED.pin_code,country=EXCLUDED.country,show_dob=EXCLUDED.show_dob,show_age=EXCLUDED.show_age,show_address=EXCLUDED.show_address,show_allergies=EXCLUDED.show_allergies,show_medication=EXCLUDED.show_medication,show_emergency_note=EXCLUDED.show_emergency_note,show_additional_contacts=EXCLUDED.show_additional_contacts,show_emergency_services=EXCLUDED.show_emergency_services,public_profile_consent_at=now(),updated_at=now()")
      .params(params("id",id,"user",user,"version",version,"name",p.fullName(),"blood",p.bloodGroup(),"city",p.city(),"state",p.state(),"dob",p.dateOfBirth()==null?null:java.sql.Date.valueOf(p.dateOfBirth()),"age",p.ageYears(),"allergies",m.allergies(),"condition",m.condition(),"medication",m.medication(),"note",m.note(),"line1",a.line1(),"line2",a.line2(),"landmark",a.landmark(),"acity",a.city(),"astate",a.state(),"pin",a.pinCode(),"country",a.country(),"dobv",s.dob(),"agev",s.age(),"addressv",s.address(),"allergiesv",s.allergies(),"medicationv",s.medication(),"notev",s.emergencyNote(),"additionalv",s.additionalContacts(),"servicesv",s.emergencyServices())).update();
    for(int i=0;i<p.contacts().size();i++){var c=p.contacts().get(i);db.sql("INSERT INTO emergency_contacts(emergency_profile_id,name,relationship,phone_e164,is_primary,sort_order) VALUES(:id,:name,:relationship,:phone,:primary,:sort)").param("id",id).param("name",c.name()).param("relationship",c.relationship()).param("phone",AuthService.normalizePhone(c.phone())).param("primary",c.primary()).param("sort",i).update();}
    db.sql("INSERT INTO emergency_profile_versions(emergency_profile_id,version,profile_snapshot,visibility_snapshot,changed_by) VALUES(:id,:version,CAST(:snapshot AS jsonb),CAST(:visibility AS jsonb),:user)")
      .param("id",id).param("version",version).param("snapshot",json(p)).param("visibility",json(s)).param("user",user).update();return id;
  }
  private String json(Object value){try{return json.writeValueAsString(value);}catch(JacksonException e){throw new IllegalStateException("Could not snapshot the emergency profile",e);}}
  private static Map<String,Object> params(Object... values){Map<String,Object> map=new HashMap<>();for(int i=0;i<values.length;i+=2)map.put((String)values[i],values[i+1]);return map;}
  private static String nullToEmpty(String s){return s==null?"":s;} private static ApiException bad(String s){return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"VALIDATION_ERROR",s);}
  public record Checkout(@NotBlank @Pattern(regexp="Helmet|Bike / Scooter|Car|Bag|ID / Personal|Other") String useCase,@NotNull UUID shippingQuoteId,@Valid @NotNull Profile profile,@Valid @NotNull Delivery delivery){}
  public record Profile(@NotBlank @Size(min=2,max=100) String fullName,@Pattern(regexp="A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-") String bloodGroup,@NotBlank @Size(max=100) String city,@NotBlank @Size(max=100) String state,@PastOrPresent java.time.LocalDate dateOfBirth,@Min(0) @Max(120) Integer ageYears,@Valid @Size(min=1,max=5) List<Contact> contacts,@Valid @NotNull Medical medical,@Valid @NotNull Address address,@Valid @NotNull Selections selections){}
  public record Contact(@NotBlank @Size(max=100) String name,@NotBlank @Size(max=30) String relationship,@NotBlank @Size(max=20) String phone,boolean primary){} public record Medical(@Size(max=500) String allergies,@Size(max=500) String condition,@Size(max=500) String medication,@Size(max=500) String note){} public record Address(@Size(max=200) String line1,@Size(max=200) String line2,@Size(max=200) String landmark,@Size(max=100) String city,@Size(max=100) String state,@Pattern(regexp="|\\d{6}") String pinCode,@Size(max=100) String country){} public record Selections(boolean dob,boolean age,boolean address,boolean allergies,boolean medication,boolean emergencyNote,boolean additionalContacts,boolean emergencyServices){}
  public record Delivery(@NotBlank @Size(max=100) String recipient,@NotBlank @Size(max=20) String phone,@NotBlank @Size(max=200) String line1,@Size(max=200) String line2,@Size(max=200) String landmark,@NotBlank @Size(max=100) String city,@NotBlank @Size(max=100) String state,@Pattern(regexp="\\d{6}") String pinCode,@NotBlank @Size(max=100) String country){}
  public record OrderView(UUID id,String orderNumber,String paymentStatus,int totalPaise,String currency,String useCase,String product,int shippingPaise,UUID profileId){}
  private record Quote(UUID id,int charge,boolean available,Instant expires){} private record Product(UUID id,String name,int price,int stickers){}
}
