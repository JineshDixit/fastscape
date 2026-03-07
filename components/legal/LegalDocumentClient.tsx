'use client';

import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { ChevronRight, FileText } from 'lucide-react';
import { Link } from '@/localization/navigation';
import { legalService } from '@/app/axios/services/legal';
import type { LegalDocument, LegalDocumentSummary } from '@/common/interfaces';
import LegalContentRenderer, { formatLegalDate, getHeadingBlocks } from './LegalContentRenderer';

type Props = {
  slug: string;
};

const LegalDocumentClient = ({ slug }: Props) => {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [documents, setDocuments] = useState<LegalDocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [documentResponse, documentsResponse] = await Promise.all([
          legalService.getDocumentBySlug(slug),
          legalService.getDocuments(),
        ]);

        if (!isMounted) return;

        setDocument(documentResponse.data || null);
        setDocuments(documentsResponse.data || []);
      } catch (error) {
        if (!isMounted) return;

        if (isAxiosError(error)) {
          setError((error.response?.data as { message?: string } | undefined)?.message || 'Failed to load this legal page.');
        } else if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to load this legal page.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen py-8 md:py-14">
        <div className="global-container grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="h-72 animate-pulse rounded-[1.75rem] border border-slate-200 bg-slate-100" />
          <div className="h-[36rem] animate-pulse rounded-[1.75rem] border border-slate-200 bg-slate-100" />
        </div>
      </main>
    );
  }

  if (error || !document) {
    return (
      <main className="min-h-screen py-8 md:py-14">
        <div className="global-container">
          <section className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-700">
            <p>{error || 'Legal page not found.'}</p>
            <Link href="/legal" className="mt-4 inline-flex items-center gap-2 font-semibold text-red-800 underline-offset-4 hover:underline">
              Browse legal pages
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const headingBlocks = getHeadingBlocks(document.blocks);
  const relatedDocuments = documents.filter((item) => item.slug !== document.slug);

  return (
    <main className="min-h-screen py-8 md:py-14">
      <div className="global-container grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.28)]">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">Documents</p>
            <div className="mt-4 space-y-2">
              {documents.map((item) => (
                <Link
                  key={item.id}
                  href={`/legal/${item.slug}`}
                  className={`block rounded-2xl px-3 py-3 text-sm transition-colors ${
                    item.slug === document.slug ? 'bg-sky-50 font-semibold text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {headingBlocks.length > 0 && (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.28)]">
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">On this page</p>
              <nav className="mt-4 space-y-2">
                {headingBlocks.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className="block rounded-2xl px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-sky-700"
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </aside>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_-35px_rgba(15,23,42,0.28)]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(6,176,252,0.18),_transparent_32%),linear-gradient(135deg,_#f8fcff_0%,_#ffffff_52%,_#eef8ff_100%)] px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-sky-700">
                <FileText className="h-3.5 w-3.5" />
                Legal
              </span>
              <span>Version {document.version}</span>
            </div>

            <div className="mt-5 space-y-4">
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{document.title}</h1>
              {document.description && <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">{document.description}</p>}
              <p className="text-sm font-medium text-slate-500">Last updated {formatLegalDate(document.updatedAt)}</p>
            </div>
          </div>

          <div className="space-y-10 px-6 py-8 md:px-10 md:py-10">
            <LegalContentRenderer blocks={document.blocks} />

            {relatedDocuments.length > 0 && (
              <div className="border-t border-slate-200 pt-8">
                <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">Related documents</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {relatedDocuments.map((item) => (
                    <Link
                      key={item.id}
                      href={`/legal/${item.slug}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default LegalDocumentClient;
