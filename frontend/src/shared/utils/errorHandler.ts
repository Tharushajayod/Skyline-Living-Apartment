/**
 * Centralized User-Friendly Error Handling Utility for Skyline Living.
 * Converts technical exceptions, raw HTTP errors, internal IDs, and stack traces
 * into meaningful, human-friendly messages for customers and staff.
 */

export function getFriendlyErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback;

  let raw = '';
  if (typeof err === 'string') {
    raw = err;
  } else if (err instanceof Error) {
    raw = err.message;
  } else if (typeof err === 'object' && err !== null) {
    if ('message' in err && typeof (err as any).message === 'string') {
      raw = (err as any).message;
    } else if ('error' in err && typeof (err as any).error === 'string') {
      raw = (err as any).error;
    }
  }

  if (!raw || !raw.trim()) return fallback;
  const msg = raw.trim();

  // 1. Review-related messages
  if (
    msg.includes('undefined (Purchased) — Already Reviewed') ||
    msg.includes('already submitted a review') ||
    msg.includes('already reviewed') ||
    msg.includes('hasReviewed')
  ) {
    return 'You have already reviewed this apartment.';
  }
  if (
    msg.includes('only write reviews for residences') ||
    msg.includes('not eligible to review') ||
    msg.includes('only review apartments you are eligible')
  ) {
    return 'You can only review apartments you are eligible to review.';
  }
  if (msg.includes('Failed to submit review') && !msg.includes(':')) {
    return 'Unable to submit your review. Please try again.';
  }

  // 2. ID / reference errors & undefined leaking
  if (
    msg.includes('Invalid ID format') ||
    msg.includes('Expected UUID') ||
    msg.includes('Apartment ID is null') ||
    msg.includes('Invalid reference identifier') ||
    msg.includes('undefined') ||
    msg.includes('null')
  ) {
    return "We couldn't find this apartment. Please refresh the page and try again.";
  }

  // 3. Appointment & Viewing errors
  if (
    msg.includes('Viewing date cannot be in the past') ||
    msg.includes('Appointment date cannot be in the past') ||
    msg.includes('Invalid date format') ||
    msg.includes('Please select an appointment date')
  ) {
    return 'Please select a valid appointment date.';
  }
  if (msg.includes('already passed for today')) {
    return 'The selected time slot has already passed for today. Please choose a future time slot.';
  }
  if (
    msg.includes('already booked for this apartment') ||
    msg.includes('Appointment already exists') ||
    msg.includes('already have an appointment')
  ) {
    return 'You already have an appointment or this time slot is already booked.';
  }
  if (msg.includes('Cannot book viewing for a sold apartment')) {
    return 'This apartment is no longer available for viewings.';
  }
  if (msg.includes('Viewing appointment required before reserving')) {
    return 'A completed viewing tour is required before reserving this residence.';
  }

  // 4. Reservation errors
  if (msg.includes('already have an active reservation') || msg.includes('already reserved')) {
    return 'You already have an active reservation for this apartment.';
  }
  if (
    msg.includes('currently unavailable for reservation') ||
    msg.includes('Cannot reserve') ||
    msg.includes('already sold')
  ) {
    return 'This apartment is currently unavailable for reservation.';
  }

  // 5. Payment & Payment Plan errors
  if (msg.includes('already been completed') || msg.includes('Payment already completed')) {
    return 'This payment has already been completed.';
  }
  if (
    msg.includes('upload a valid payment') ||
    msg.includes('payment slip') ||
    msg.includes('proof') ||
    msg.includes('Upload Error')
  ) {
    return 'Please upload a valid payment proof image.';
  }
  if (msg.includes('First payment date cannot be in the past') || msg.includes('Payment plan start date cannot be in the past')) {
    return 'First payment date cannot be in the past. Please select today or a future date.';
  }
  if (msg.includes('Payment amount is too high') || msg.includes('Selected payments do not cover')) {
    return 'Please adjust your installment amount to cover the remaining balance.';
  }
  if (
    msg.includes('already has a pending or approved payment plan') ||
    msg.includes('already has an active') ||
    msg.includes('active payment plan')
  ) {
    return 'You already have an active payment plan for this reservation.';
  }
  if (msg.includes('already been fully paid') || msg.includes('already fully paid')) {
    return 'This apartment has already been fully paid.';
  }

  // 6. Favorites
  if (msg.toLowerCase().includes('favorite')) {
    return 'Unable to update your favorites. Please try again.';
  }

  // 7. Inquiries
  if (msg.toLowerCase().includes('inquiry')) {
    return 'Unable to send your inquiry. Please check the details and try again.';
  }

  // 8. Authentication & Authorization
  if (msg.includes('Bad credentials') || msg.includes('Invalid email or password')) {
    return 'Invalid credentials. Please check your email and password.';
  }
  if (msg.includes('Access is denied') || msg.includes('Forbidden') || msg.includes('403')) {
    return 'You do not have permission to perform this action.';
  }
  if (msg.includes('session has expired') || msg.includes('401') || msg.includes('Unauthorized')) {
    return 'Your session has expired. Please sign in again.';
  }

  // 9. Technical / Framework / SQL errors
  if (
    msg.includes('org.springframework') ||
    msg.includes('SQL') ||
    msg.includes('constraint') ||
    msg.includes('Cannot read properties of') ||
    msg.includes('Internal Server Error') ||
    msg.includes('API Error: 500') ||
    msg.includes('500') ||
    msg.includes('NullPointer')
  ) {
    return "We couldn't complete your request. Please try again.";
  }

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (msg.startsWith('API Error: 400') || msg.includes('Validation failed')) {
    return 'Please check your information and try again.';
  }

  return msg;
}
