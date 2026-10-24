import { affordability, calculateEmi } from './emi-calculator.component';

describe('calculateEmi', () => {
  it('matches the backend reducing-balance formula', () => {
    const r = calculateEmi(150000, 24, 10.5);
    expect(r.emi).toBeCloseTo(6956.41, 2);
    expect(r.total).toBeCloseTo(166953.84, 0);
  });

  it('splits principal evenly at 0% interest', () => {
    expect(calculateEmi(12000, 12, 0).emi).toBe(1000);
  });

  it('returns zeros for invalid input', () => {
    expect(calculateEmi(0, 12, 10).emi).toBe(0);
  });
});

describe('affordability', () => {
  it('classifies repayment-to-income ratios', () => {
    expect(affordability(2000, 10000)?.label).toBe('Comfortable');
    expect(affordability(4000, 10000)?.label).toBe('Manageable');
    expect(affordability(6000, 10000)?.label).toBe('Stretched');
    expect(affordability(6000, 0)).toBeNull();
  });
});
