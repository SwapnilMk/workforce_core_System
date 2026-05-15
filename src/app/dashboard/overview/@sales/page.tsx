import { delay } from '@/constants/mock-api';
import { RecentAttendance } from '@/features/overview/components/recent-sales';

export default async function Sales() {
  await delay(3000);
  return <RecentAttendance />;
}
