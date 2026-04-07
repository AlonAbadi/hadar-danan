import { getBookings, getCalendlyData } from '@/lib/admin/queries';
import BookingsClient from './client';

export default async function BookingsPage() {
  const [bookings, calendly] = await Promise.all([
    getBookings('30d'),
    getCalendlyData(),
  ]);
  return <BookingsClient bookings={bookings} calendly={calendly} />;
}
