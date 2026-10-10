package com.rescuekaro.backend.emergency;

import com.rescuekaro.backend.dto.ApiResponse;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController @RequestMapping("/api/v1/emergency-directory")
public class EmergencyDirectoryController {
 private final JdbcClient db; public EmergencyDirectoryController(JdbcClient db){this.db=db;}
 @GetMapping public ApiResponse<Directory> lookup(@RequestParam String country,@RequestParam String state,@RequestParam String city){
  List<Number> numbers=db.sql("SELECT label,phone_number,source_name,last_verified_at FROM emergency_directory_entries WHERE active=true AND verified=true AND last_verified_at IS NOT NULL AND lower(country)=lower(:country) AND (city='' OR lower(city)=lower(:city)) AND (state='' OR lower(state)=lower(:state)) ORDER BY city DESC,state DESC,label")
   .param("country",country).param("state",state).param("city",city).query((rs,n)->new Number(rs.getString(1),rs.getString(2),true)).list();
  return ApiResponse.of(new Directory(country,state,city,numbers,numbers.isEmpty()?"unavailable":"verified",numbers.isEmpty()?"No verified directory entries":"RescueKaro verified emergency directory",""));
 }
 public record Number(String label,String number,boolean verified){} public record Directory(String country,String state,String city,List<Number> services,String verificationStatus,String source,String lastVerified){}
}
