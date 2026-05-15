'use client';

import { LabelList, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

const chartData = [
  { dept: 'operations', employees: 275, fill: 'var(--color-chrome)' },
  { dept: 'tech', employees: 200, fill: 'var(--color-safari)' },
  { dept: 'hr', employees: 187, fill: 'var(--color-firefox)' },
  { dept: 'sales', employees: 173, fill: 'var(--color-edge)' },
  { dept: 'other', employees: 90, fill: 'var(--color-other)' }
];

const chartConfig = {
  employees: {
    label: 'Employees'
  },
  operations: {
    label: 'Operations',
    color: 'var(--chart-1)'
  },
  tech: {
    label: 'Tech',
    color: 'var(--chart-2)'
  },
  hr: {
    label: 'HR',
    color: 'var(--chart-3)'
  },
  sales: {
    label: 'Sales',
    color: 'var(--chart-4)'
  },
  other: {
    label: 'Other',
    color: 'var(--chart-5)'
  }
} satisfies ChartConfig;

export function PieGraph() {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>
          Workforce Composition
          <Badge variant='outline'>
            <Icons.trendingUp />
            +5.2%
          </Badge>
        </CardTitle>
        <CardDescription>Employee Distribution by Dept</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={chartConfig}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey='employees' hideLabel />} />
            <Pie
              data={chartData}
              innerRadius={30}
              dataKey='employees'
              nameKey='dept'
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey='employees'
                stroke='none'
                fontSize={12}
                fontWeight={500}
                fill='currentColor'
                formatter={(value: number) => value.toString()}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
