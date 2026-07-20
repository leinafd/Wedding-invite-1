export interface RSVP {
  id: string;
  name: string;
  guestsCount: number;
  status: 'attending' | 'declined' | 'undecided';
  dietary: string;
  message: string;
  submittedAt: string;
}

export interface RSVPStats {
  totalAttending: number;
  totalDeclined: number;
  totalUndecided: number;
  totalGuests: number;
}
