import type { LegalContentBlock } from '@/common/interfaces';

const getBlockKey = (block: LegalContentBlock, index: number) => block.id || `${block.kind}-${index}`;

export const getHeadingBlocks = (blocks: LegalContentBlock[]) =>
  blocks
    .filter((block) => block.kind === 'heading' && block.text?.trim())
    .map((block, index) => ({
      id: block.id || `section-${index + 1}`,
      text: block.text!.trim(),
    }));

export const formatLegalDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));

type Props = {
  blocks: LegalContentBlock[];
};

const LegalContentRenderer = ({ blocks }: Props) => {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        const key = getBlockKey(block, index);

        switch (block.kind) {
          case 'heading':
            if (!block.text?.trim()) return null;

            return (
              <section key={key} id={block.id || `section-${index + 1}`} className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{block.text}</h2>
              </section>
            );

          case 'bullet_list':
            if (!block.items?.length) return null;

            return (
              <ul key={key} className="space-y-2 ps-5 text-sm leading-7 text-slate-700 marker:text-sky-500 md:text-base">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            );

          case 'numbered_list':
            if (!block.items?.length) return null;

            return (
              <ol
                key={key}
                className="space-y-2 ps-5 text-sm leading-7 text-slate-700 marker:font-semibold marker:text-sky-600 md:text-base"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{item}</li>
                ))}
              </ol>
            );

          case 'quote':
            if (!block.text?.trim()) return null;

            return (
              <blockquote
                key={key}
                className="border-sky-200 bg-sky-50/70 text-slate-700 rounded-2xl border-s-4 px-5 py-4 text-sm leading-7 italic md:text-base"
              >
                {block.text}
              </blockquote>
            );

          case 'paragraph':
          default:
            if (!block.text?.trim()) return null;

            return (
              <p key={key} className="text-sm leading-7 text-slate-700 md:text-base">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
};

export default LegalContentRenderer;
