import StudyPlanPage from '@/components/career-map/roadmap/StudyPlanPage';

export const metadata = { title: 'Study Plan — Proflect' };

export default function StudyPlanRoute({ params }) {
  return <StudyPlanPage studyPlanId={params.studyPlanId} />;
}
