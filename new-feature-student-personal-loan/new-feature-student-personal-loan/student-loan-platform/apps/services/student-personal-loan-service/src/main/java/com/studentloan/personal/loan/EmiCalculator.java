package com.studentloan.personal.loan;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/**
 * Educational EMI estimate using the standard reducing-balance formula:
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1), where r is the monthly rate.
 */
public final class EmiCalculator {

    private static final MathContext MC = MathContext.DECIMAL64;
    /** Simple teaching guideline: repayments above half of monthly income are flagged as a stretch. */
    private static final BigDecimal COMFORTABLE = new BigDecimal("0.30");
    private static final BigDecimal STRETCH = new BigDecimal("0.50");

    private EmiCalculator() {
    }

    public record EmiEstimate(BigDecimal monthlyInstallment, BigDecimal totalPayable, BigDecimal totalInterest,
                              BigDecimal incomeRatio, String affordability, String disclaimer) {
    }

    public static EmiEstimate estimate(BigDecimal principal, int tenureMonths, BigDecimal annualRatePercent,
                                       BigDecimal monthlyIncome) {
        if (principal == null || principal.signum() <= 0 || tenureMonths <= 0 || annualRatePercent == null) {
            throw new IllegalArgumentException("Amount, tenure and rate must be positive");
        }
        BigDecimal emi;
        if (annualRatePercent.signum() == 0) {
            emi = principal.divide(BigDecimal.valueOf(tenureMonths), MC);
        } else {
            BigDecimal r = annualRatePercent.divide(BigDecimal.valueOf(1200), MC);
            BigDecimal growth = BigDecimal.ONE.add(r).pow(tenureMonths, MC);
            emi = principal.multiply(r, MC).multiply(growth, MC).divide(growth.subtract(BigDecimal.ONE), MC);
        }
        emi = emi.setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = emi.multiply(BigDecimal.valueOf(tenureMonths)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal interest = total.subtract(principal).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        BigDecimal ratio = null;
        String affordability = "UNKNOWN";
        if (monthlyIncome != null && monthlyIncome.signum() > 0) {
            ratio = emi.divide(monthlyIncome, 4, RoundingMode.HALF_UP);
            affordability = ratio.compareTo(COMFORTABLE) <= 0 ? "COMFORTABLE"
                    : ratio.compareTo(STRETCH) <= 0 ? "MANAGEABLE" : "STRETCHED";
        }
        return new EmiEstimate(emi, total, interest, ratio, affordability,
                "Educational estimate only. Not a credit decision or a loan offer.");
    }
}
