import CourseDetailPage from '@/components/career-map/course/CourseDetailPage';

export const metadata = { title: 'Course — Proflect' };

export default function TopicRoute({ params }) {
  return <CourseDetailPage studyPlanId={params.studyPlanId} topicId={params.topicId} />;
}
