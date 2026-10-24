import { JOURNEY, STATUS_META, journeyStep } from './labels';
import { LoanStatus } from './models';

describe('status labels', () => {
  it('has user-facing help text for every status', () => {
    (Object.keys(STATUS_META) as LoanStatus[]).forEach(s => {
      expect(STATUS_META[s].label.length).toBeGreaterThan(0);
      expect(STATUS_META[s].help.length).toBeGreaterThan(10);
    });
  });

  it('maps statuses onto the journey in order', () => {
    expect(journeyStep('DETAILS_PENDING')).toBe(1);
    expect(journeyStep('DOCUMENTS_PENDING')).toBe(2);
    expect(journeyStep('SUBMITTED')).toBe(4);
    expect(journeyStep('APPROVED')).toBe(JOURNEY.length);
  });
});
