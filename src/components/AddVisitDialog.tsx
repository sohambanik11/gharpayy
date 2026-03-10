import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ScheduleVisitDialog from '@/components/ScheduleVisitDialog';

const AddVisitDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" className="gap-1.5 text-xs rounded-xl" onClick={() => setOpen(true)}>
        <Plus size={13} /> Schedule Visit
      </Button>
      <ScheduleVisitDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default AddVisitDialog;
