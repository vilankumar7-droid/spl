package com.studentloan.personal.loan;

import com.studentloan.personal.common.exception.ApiException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/calculator")
public class CalculatorController {

    @GetMapping("/emi")
    public EmiCalculator.EmiEstimate emi(@RequestParam BigDecimal amount,
                                         @RequestParam int tenureMonths,
                                         @RequestParam BigDecimal annualRate,
                                         @RequestParam(required = false) BigDecimal monthlyIncome) {
        if (amount.signum() <= 0 || tenureMonths <= 0 || tenureMonths > 360 || annualRate.signum() < 0
                || annualRate.compareTo(BigDecimal.valueOf(50)) > 0) {
            throw ApiException.badRequest("INVALID_CALCULATOR_INPUT",
                    "Amount must be positive, tenure 1-360 months and rate 0-50%");
        }
        return EmiCalculator.estimate(amount, tenureMonths, annualRate, monthlyIncome);
    }
}
