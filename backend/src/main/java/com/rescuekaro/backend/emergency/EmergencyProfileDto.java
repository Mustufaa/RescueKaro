package com.rescuekaro.backend.emergency;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmergencyProfileDto(
        UUID id, Integer version,
        @Size(min=2,max=100) String fullName,
        @Pattern(regexp="A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-") String bloodGroup,
        @Size(min=2,max=100) String city, @Size(min=2,max=100) String state,
        @PastOrPresent LocalDate dateOfBirth, @Min(0) @Max(120) Integer ageYears,
        @Valid @Size(min=1,max=5) List<Contact> contacts,
        @Valid @NotNull Medical medical, @Valid @NotNull Address address,
        @Valid @NotNull Selections selections,
        Boolean publicEmergencyProfileAccepted,
        Instant updatedAt) {

    public record Contact(UUID id,@Size(min=2,max=100) String name,@NotBlank String relationship,
                          @NotBlank String phone,boolean primary) {}
    public record Medical(@Size(max=500) String allergies,@Size(max=500) String condition,
                          @Size(max=500) String medication,@Size(max=500) String note) {}
    public record Address(@Size(max=200) String line1,@Size(max=200) String line2,@Size(max=200) String landmark,
                          @Size(max=100) String city,@Size(max=100) String state,
                          @Pattern(regexp="|\\d{6}") String pinCode,@Size(max=100) String country) {}
    public record Selections(boolean dob,boolean age,boolean address,boolean allergies,boolean medication,
                             boolean emergencyNote,boolean additionalContacts,boolean emergencyServices) {}
}
