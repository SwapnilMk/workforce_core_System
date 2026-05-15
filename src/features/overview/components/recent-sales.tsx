import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

const attendanceData = [
  {
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/1.png',
    fallback: 'OM',
    status: 'Punctual',
    time: '09:00 AM'
  },
  {
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/2.png',
    fallback: 'JL',
    status: 'Late',
    time: '10:15 AM'
  },
  {
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/3.png',
    fallback: 'IN',
    status: 'Punctual',
    time: '08:55 AM'
  },
  {
    name: 'William Kim',
    email: 'will@email.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/4.png',
    fallback: 'WK',
    status: 'On Leave',
    time: 'N/A'
  },
  {
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    avatar: 'https://api.slingacademy.com/public/sample-users/5.png',
    fallback: 'SD',
    status: 'Punctual',
    time: '09:05 AM'
  }
];

export function RecentAttendance() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Attendance</CardTitle>
        <CardDescription>92% of the workforce has punched in today.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {attendanceData.map((item, index) => (
            <div key={index} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarImage src={item.avatar} alt='Avatar' />
                <AvatarFallback>{item.fallback}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1'>
                <p className='text-sm leading-none font-medium'>{item.name}</p>
                <p className='text-muted-foreground text-xs'>{item.status}</p>
              </div>
              <div className='ml-auto font-bold text-xs'>{item.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
