import { Suspense } from 'react';
import MyCoursesPage from '@/components/my-courses/MyCoursesPage';

export const metadata = { title: 'My Courses — Proflect' };

export default function MyCoursesRoute() {
  return <Suspense><MyCoursesPage /></Suspense>;
}
