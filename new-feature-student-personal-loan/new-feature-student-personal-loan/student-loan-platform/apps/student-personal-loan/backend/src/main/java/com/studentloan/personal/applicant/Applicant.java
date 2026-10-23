package com.studentloan.personal.applicant;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "applicant")
public class Applicant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "full_name")
    private String fullName;

    private String phone;

    private String city;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type")
    private EmploymentType employmentType;

    @Column(name = "institution_name")
    private String institutionName;

    @Column(name = "monthly_income")
    private BigDecimal monthlyIncome;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Applicant() {
    }

    public Applicant(Long userId, String fullName) {
        this.userId = userId;
        this.fullName = fullName;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public boolean isProfileComplete() {
        return notBlank(fullName) && notBlank(phone) && employmentType != null
                && monthlyIncome != null && monthlyIncome.signum() >= 0;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    public void update(String fullName, String phone, String city, EmploymentType employmentType,
                       String institutionName, BigDecimal monthlyIncome) {
        this.fullName = fullName;
        this.phone = phone;
        this.city = city;
        this.employmentType = employmentType;
        this.institutionName = institutionName;
        this.monthlyIncome = monthlyIncome;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public String getCity() { return city; }
    public EmploymentType getEmploymentType() { return employmentType; }
    public String getInstitutionName() { return institutionName; }
    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public Instant getUpdatedAt() { return updatedAt; }
}
