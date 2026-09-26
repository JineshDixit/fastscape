import LegalDocumentClient from '@/components/legal/LegalDocumentClient';

const LegalDocumentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  return <LegalDocumentClient slug={slug} />;
};

export default LegalDocumentPage;
