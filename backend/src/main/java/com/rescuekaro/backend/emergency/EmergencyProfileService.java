package com.rescuekaro.backend.emergency;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.rescuekaro.backend.auth.AuthService;
import com.rescuekaro.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmergencyProfileService {
    private final JdbcClient db; private final ObjectMapper json;
    public EmergencyProfileService(JdbcClient db,ObjectMapper json){this.db=db;this.json=json;}

    public EmergencyProfileDto get(UUID userId){
        ProfileRow row=db.sql("SELECT * FROM emergency_profiles WHERE user_id=:user").param("user",userId)
                .query((rs,n)->new ProfileRow((UUID)rs.getObject("id"),rs.getInt("version"),rs.getString("full_name"),rs.getString("blood_group"),
                        rs.getString("city"),rs.getString("state"),rs.getDate("date_of_birth")==null?null:rs.getDate("date_of_birth").toLocalDate(),rs.getObject("age_years")==null?null:rs.getInt("age_years"),
                        rs.getString("allergies"),rs.getString("medical_condition"),rs.getString("medication"),rs.getString("emergency_note"),
                        rs.getString("line1"),rs.getString("line2"),rs.getString("landmark"),rs.getString("address_city"),rs.getString("address_state"),rs.getString("pin_code"),rs.getString("country"),
                        rs.getBoolean("show_dob"),rs.getBoolean("show_age"),rs.getBoolean("show_address"),rs.getBoolean("show_allergies"),rs.getBoolean("show_medication"),
                        rs.getBoolean("show_emergency_note"),rs.getBoolean("show_additional_contacts"),rs.getBoolean("show_emergency_services"),
                        rs.getTimestamp("public_profile_consent_at")!=null,rs.getTimestamp("updated_at").toInstant()))
                .optional().orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND","Emergency profile not found."));
        List<EmergencyProfileDto.Contact> contacts=db.sql("SELECT id,name,relationship,phone_e164,is_primary FROM emergency_contacts WHERE emergency_profile_id=:id ORDER BY sort_order")
                .param("id",row.id()).query((rs,n)->new EmergencyProfileDto.Contact((UUID)rs.getObject("id"),rs.getString("name"),rs.getString("relationship"),rs.getString("phone_e164"),rs.getBoolean("is_primary"))).list();
        return row.dto(contacts);
    }

    @Transactional
    public EmergencyProfileDto save(UUID userId,EmergencyProfileDto input){
        validateContacts(input.contacts());
        String snapshot=writeJson(input); String visibility=writeJson(input.selections());
        UUID profileId=db.sql("SELECT id FROM emergency_profiles WHERE user_id=:user FOR UPDATE").param("user",userId).query(UUID.class).optional().orElse(null);
        int version;
        Instant consent=Boolean.TRUE.equals(input.publicEmergencyProfileAccepted())?Instant.now():null;
        if(profileId==null){
            if(input.version()!=null && input.version()>0) throw stale();
            profileId=UUID.randomUUID(); version=1;
            db.sql("INSERT INTO emergency_profiles(id,user_id,version,full_name,blood_group,city,state,date_of_birth,age_years,allergies,medical_condition,medication,emergency_note,line1,line2,landmark,address_city,address_state,pin_code,country,show_dob,show_age,show_address,show_allergies,show_medication,show_emergency_note,show_additional_contacts,show_emergency_services,public_profile_consent_at) VALUES(:id,:user,1,:name,:blood,:city,:state,:dob,:age,:allergies,:condition,:medication,:note,:line1,:line2,:landmark,:acity,:astate,:pin,:country,:dobv,:agev,:addressv,:allergiesv,:medicationv,:notev,:additionalv,:servicesv,:consent)")
                    .params(params(profileId,userId,input,consent)).update();
        }else{
            if(input.version()==null) throw stale(); version=input.version()+1;
            int changed=db.sql("UPDATE emergency_profiles SET version=version+1,full_name=:name,blood_group=:blood,city=:city,state=:state,date_of_birth=:dob,age_years=:age,allergies=:allergies,medical_condition=:condition,medication=:medication,emergency_note=:note,line1=:line1,line2=:line2,landmark=:landmark,address_city=:acity,address_state=:astate,pin_code=:pin,country=:country,show_dob=:dobv,show_age=:agev,show_address=:addressv,show_allergies=:allergiesv,show_medication=:medicationv,show_emergency_note=:notev,show_additional_contacts=:additionalv,show_emergency_services=:servicesv,public_profile_consent_at=:consent,updated_at=now() WHERE id=:id AND version=:expected")
                    .params(params(profileId,userId,input,consent)).param("expected",input.version()).update();
            if(changed!=1) throw stale();
            db.sql("DELETE FROM emergency_contacts WHERE emergency_profile_id=:id").param("id",profileId).update();
        }
        for(int i=0;i<input.contacts().size();i++){
            EmergencyProfileDto.Contact c=input.contacts().get(i);
            db.sql("INSERT INTO emergency_contacts(id,emergency_profile_id,name,relationship,phone_e164,is_primary,sort_order) VALUES(:id,:profile,:name,:relationship,:phone,:primary,:sort)")
                    .param("id",c.id()==null?UUID.randomUUID():c.id()).param("profile",profileId).param("name",clean(c.name())).param("relationship",clean(c.relationship()))
                    .param("phone",AuthService.normalizePhone(c.phone())).param("primary",c.primary()).param("sort",i).update();
        }
        db.sql("INSERT INTO emergency_profile_versions(emergency_profile_id,version,profile_snapshot,visibility_snapshot,changed_by) VALUES(:id,:version,CAST(:snapshot AS jsonb),CAST(:visibility AS jsonb),:user)")
                .param("id",profileId).param("version",version).param("snapshot",snapshot).param("visibility",visibility).param("user",userId).update();
        return get(userId);
    }

    private static java.util.Map<String,Object> params(UUID id,UUID user,EmergencyProfileDto p,Instant consent){
        EmergencyProfileDto.Medical m=p.medical(); EmergencyProfileDto.Address a=p.address(); EmergencyProfileDto.Selections s=p.selections();
        java.util.Map<String,Object> x=new java.util.HashMap<>();
        x.put("id",id);x.put("user",user);x.put("name",clean(p.fullName()));x.put("blood",p.bloodGroup());x.put("city",clean(p.city()));x.put("state",clean(p.state()));x.put("dob",p.dateOfBirth()==null?null:Date.valueOf(p.dateOfBirth()));x.put("age",p.ageYears());
        x.put("allergies",clean(m.allergies()));x.put("condition",clean(m.condition()));x.put("medication",clean(m.medication()));x.put("note",clean(m.note()));
        x.put("line1",clean(a.line1()));x.put("line2",clean(a.line2()));x.put("landmark",clean(a.landmark()));x.put("acity",clean(a.city()));x.put("astate",clean(a.state()));x.put("pin",clean(a.pinCode()));x.put("country",clean(a.country()).isBlank()?"India":clean(a.country()));
        x.put("dobv",s.dob());x.put("agev",s.age());x.put("addressv",s.address());x.put("allergiesv",s.allergies());x.put("medicationv",s.medication());x.put("notev",s.emergencyNote());x.put("additionalv",s.additionalContacts());x.put("servicesv",s.emergencyServices());x.put("consent",consent==null?null:Timestamp.from(consent));
        return x;
    }
    private static void validateContacts(List<EmergencyProfileDto.Contact> contacts){
        if(contacts==null||contacts.isEmpty()||contacts.size()>5) throw invalid("Provide between one and five emergency contacts.");
        if(contacts.stream().filter(EmergencyProfileDto.Contact::primary).count()!=1) throw invalid("Exactly one emergency contact must be primary.");
        Set<String> phones=new HashSet<>(); for(var c:contacts) if(!phones.add(AuthService.normalizePhone(c.phone()))) throw invalid("Emergency contact phone numbers must be unique.");
    }
    private String writeJson(Object value){try{return json.writeValueAsString(value);}catch(JacksonException e){throw new IllegalStateException(e);}}
    private static String clean(String value){return value==null?"":value.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]","").trim();}
    private static ApiException invalid(String message){return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,"VALIDATION_ERROR",message);}
    private static ApiException stale(){return new ApiException(HttpStatus.CONFLICT,"STALE_PROFILE_VERSION","The profile changed; reload it before saving.");}

    private record ProfileRow(UUID id,int version,String name,String blood,String city,String state,LocalDate dob,Integer ageYears,String allergies,String condition,String medication,String note,
                              String line1,String line2,String landmark,String addressCity,String addressState,String pin,String country,
                              boolean showDob,boolean showAge,boolean showAddress,boolean showAllergies,boolean showMedication,boolean showNote,boolean showAdditional,boolean showServices,
                              boolean consent,Instant updated){
        EmergencyProfileDto dto(List<EmergencyProfileDto.Contact> contacts){return new EmergencyProfileDto(id,version,name,blood,city,state,dob,ageYears,contacts,
                new EmergencyProfileDto.Medical(allergies,condition,medication,note),new EmergencyProfileDto.Address(line1,line2,landmark,addressCity,addressState,pin,country),
                new EmergencyProfileDto.Selections(showDob,showAge,showAddress,showAllergies,showMedication,showNote,showAdditional,showServices),consent,updated);}
    }
}
