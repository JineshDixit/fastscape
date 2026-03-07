'use client';

import { useEffect, useState } from 'react';
import { Scale, ShieldCheck, WalletCards, FileText } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Link } from '@/localization/navigation';
import { legalService } from '@/app/axios/services/legal';
import type { LegalDocumentSummary } from '@/common/interfaces';
import { formatLegalDate } from './LegalContentRenderer';

const icons = [ShieldCheck, WalletCards, Scale, FileText];

const LegalDocumentsIndexClient = () => {
  const [documents, setDocuments] = useState<LegalDocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await legalService.getDocuments();

        if (!isMounted) return;

        setDocuments(response.data || []);
      } catch (error) {
        if (!isMounted) return;

        if (isAxiosError(error)) {
          setError((error.response?.data as { message?: string } | undefined)?.message || 'Failed to load legal pages.');
        } else if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Failed to load legal pages.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen py-8 md:py-14">
      <div className="global-container space-y-8 md:space-y-12">
        <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(6,176,252,0.18),_transparent_32%),linear-gradient(135deg,_#f8fcff_0%,_#ffffff_58%,_#eef8ff_100%)] px-6 py-10 md:px-10 md:py-14">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-sky-700 uppercase">
              Legal
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Policies and Terms</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
              Review the current Fastscape legal documents, terms, privacy disclosures, and booking policy details published from the active database records.
            </p>
          </div>
        </section>

        {isLoading ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-[1.75rem] border border-slate-200 bg-slate-100" />
            ))}
          </section>
        ) : error ? (
          <section className="rounded-[1.75rem] border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-700">{error}</section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((document, index) => {
              const Icon = icons[index % icons.length];

              return (
                <Link
                  key={document.id}
                  href={`/legal/${document.slug}`}
                  className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.28)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-slate-950 transition-colors group-hover:text-sky-700">
                        {document.title}
                      </h2>
                      <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                        Version {document.version}
                      </p>
                    </div>

                    {document.description && <p className="text-sm leading-7 text-slate-600">{document.description}</p>}

                    <div className="pt-4 text-xs font-medium text-slate-500">
                      Last updated {formatLegalDate(document.updatedAt)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default LegalDocumentsIndexClient;
