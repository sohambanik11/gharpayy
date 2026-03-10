import AppLayout from '@/components/AppLayout';
import { useBookings, useUpdateBooking, useBookingStats } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KpiCard from '@/components/KpiCard';
import { Receipt, CheckCircle, Clock, IndianRupee, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  checked_in: 'bg-info/10 text-info',
  checked_out: 'bg-muted text-muted-foreground',
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: 'bg-destructive/10 text-destructive',
  partial: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
};

const NEXT_STATUS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
};

const Bookings = () => {
  const { data: bookings, isLoading } = useBookings();
  const { data: stats } = useBookingStats();
  const updateBooking = useUpdateBooking();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const filtered = bookings?.filter(b =>
    filterStatus === 'all' || (b as any).booking_status === filterStatus
  ) || [];

  const handleStatusChange = async (id: string, status: string) => {
    if (status === 'cancelled') { setCancelId(id); return; }
    await updateBooking.mutateAsync({ id, booking_status: status });
  };

  const confirmCancel = async () => {
    if (!cancelId) return;
    await updateBooking.mutateAsync({ id: cancelId, booking_status: 'cancelled' });
    setCancelId(null);
    toast.success('Booking cancelled, bed released');
  };

  const handlePaymentChange = async (id: string, status: string) => {
    await updateBooking.mutateAsync({ id, payment_status: status });
  };

  if (isLoading) {
    return (
      <AppLayout title="Bookings" subtitle="Manage bookings and revenue">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[130px] rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Bookings" subtitle="Manage bookings, payments, and revenue tracking">
      {/* KPIs */}
      <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <KpiCard title="Total Bookings" value={stats?.total ?? 0} icon={<Receipt size={17} />} />
        <KpiCard title="Pending" value={stats?.pending ?? 0} icon={<Clock size={17} />} color="hsl(var(--warning))" />
        <KpiCard title="Confirmed" value={stats?.confirmed ?? 0} icon={<CheckCircle size={17} />} color="hsl(var(--success))" />
        <KpiCard title="Monthly Revenue" value={`₹${((stats?.revenue ?? 0) / 1000).toFixed(0)}k`} icon={<IndianRupee size={17} />} color="hsl(var(--accent))" />
        <KpiCard title="Pipeline Revenue" value={`₹${((stats?.pendingRevenue ?? 0) / 1000).toFixed(0)}k`} icon={<TrendingUp size={17} />} color="hsl(var(--info))" />
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-8 text-xs rounded-xl">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-2xs text-muted-foreground">{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="kpi-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Lead</th>
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Property</th>
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Room / Bed</th>
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Rent</th>
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Move-in</th>
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Payment</th>
                <th className="text-left px-4 py-3.5 text-2xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking: any, i: number) => {
                const nextStatuses = NEXT_STATUS[booking.booking_status] || [];
                return (
                  <motion.tr
                    key={booking.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{booking.leads?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{booking.leads?.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{booking.properties?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {booking.rooms?.room_number || '—'}{booking.beds?.bed_number ? ` / ${booking.beds.bed_number}` : ''}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {booking.monthly_rent ? `₹${Number(booking.monthly_rent).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {booking.move_in_date ? format(new Date(booking.move_in_date), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`badge-pipeline text-[10px] ${STATUS_COLORS[booking.booking_status]}`}>
                        {booking.booking_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Select value={booking.payment_status} onValueChange={v => handlePaymentChange(booking.id, v)}>
                        <SelectTrigger className="h-6 text-[10px] rounded-lg w-[90px] border-0 p-0">
                          <span className={`badge-pipeline text-[10px] ${PAYMENT_COLORS[booking.payment_status]}`}>
                            {booking.payment_status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3.5">
                      {nextStatuses.length > 0 ? (
                        <div className="flex gap-1.5">
                          {nextStatuses.map(s => (
                            <Button
                              key={s}
                              variant={s === 'cancelled' ? 'destructive' : 'default'}
                              size="sm"
                              className="h-6 text-[10px] rounded-lg px-2"
                              onClick={() => handleStatusChange(booking.id, s)}
                              disabled={updateBooking.isPending}
                            >
                              {s === 'cancelled' ? <XCircle size={10} /> : <CheckCircle size={10} />}
                              <span className="ml-1 capitalize">{s.replace('_', ' ')}</span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-xs text-muted-foreground">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" /> Cancel Booking
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the booking, release the soft lock, and revert the bed to vacant. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Bookings;
