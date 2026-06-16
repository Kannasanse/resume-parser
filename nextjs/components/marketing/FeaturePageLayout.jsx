import LoggedInBanner from './LoggedInBanner';

export default function FeaturePageLayout({ children, featureName, appHref }) {
  return (
    <>
      <LoggedInBanner featureName={featureName} appHref={appHref} />
      {children}
    </>
  );
}
