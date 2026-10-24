package com.studentloan.personal;

import com.studentloan.personal.loan.EmiCalculator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmiCalculatorTest {

    @Test
    void calculatesStandardEmi() {
        var e = EmiCalculator.estimate(new BigDecimal("150000"), 24, new BigDecimal("10.5"), new BigDecimal("25000"));
        assertThat(e.monthlyInstallment()).isEqualByComparingTo("6956.41");
        assertThat(e.totalPayable()).isEqualByComparingTo("166953.84");
        assertThat(e.affordability()).isEqualTo("COMFORTABLE");
    }

    @Test
    void zeroRateSplitsPrincipalEvenly() {
        var e = EmiCalculator.estimate(new BigDecimal("12000"), 12, BigDecimal.ZERO, null);
        assertThat(e.monthlyInstallment()).isEqualByComparingTo("1000.00");
        assertThat(e.totalInterest()).isEqualByComparingTo("0");
        assertThat(e.affordability()).isEqualTo("UNKNOWN");
    }

    @Test
    void flagsStretchedRepayments() {
        var e = EmiCalculator.estimate(new BigDecimal("500000"), 12, new BigDecimal("12"), new BigDecimal("20000"));
        assertThat(e.affordability()).isEqualTo("STRETCHED");
    }

    @Test
    void rejectsInvalidInput() {
        assertThatThrownBy(() -> EmiCalculator.estimate(BigDecimal.ZERO, 12, BigDecimal.TEN, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
