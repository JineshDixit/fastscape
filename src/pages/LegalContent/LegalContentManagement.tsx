import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  legalContentService,
  type LegalContent,
  type LegalContentBlock,
  type LegalContentVersion,
} from '@/api/services/adminService';
import { PERMISSIONS } from '@/config/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, History, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

type BlockKind = LegalContentBlock['kind'];
type EditorLocale = 'en' | 'ar';

interface LocalizedDraftDocument {
  title: string;
  description: string;
  blocks: LegalContentBlock[];
}

interface DraftDocument {
  slug: string;
  isActive: boolean;
  changeNote: string;
  localizedContent: Record<EditorLocale, LocalizedDraftDocument>;
}

const LEGACY_READ_PERMISSIONS = [
  PERMISSIONS.ADMIN.LEGAL.PRIVACY.READ,
  PERMISSIONS.ADMIN.LEGAL.REFUND.READ,
  PERMISSIONS.ADMIN.LEGAL.TERMS.READ,
  PERMISSIONS.ADMIN.LEGAL.PRIVACY.UPDATE,
  PERMISSIONS.ADMIN.LEGAL.REFUND.UPDATE,
  PERMISSIONS.ADMIN.LEGAL.TERMS.UPDATE,
];

const LEGACY_UPDATE_PERMISSION_BY_SLUG: Record<string, string> = {
  'privacy-policy': PERMISSIONS.ADMIN.LEGAL.PRIVACY.UPDATE,
  'refund-cancellation-policy': PERMISSIONS.ADMIN.LEGAL.REFUND.UPDATE,
  'terms-conditions': PERMISSIONS.ADMIN.LEGAL.TERMS.UPDATE,
};

const BLOCK_KIND_OPTIONS: Array<{ value: BlockKind; label: string }> = [
  { value: 'heading', label: 'Heading' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'bullet_list', label: 'Bullet List' },
  { value: 'numbered_list', label: 'Numbered List' },
  { value: 'quote', label: 'Quote' },
];

const EDITOR_LOCALES: Array<{ value: EditorLocale; label: string; helper: string }> = [
  {
    value: 'en',
    label: 'English',
    helper: 'Default content and fallback locale used when a translation is missing.',
  },
  {
    value: 'ar',
    label: 'Arabic',
    helper: 'Served to the Arabic client locale when translated content is available.',
  },
];

const generateClientId = (): string => {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);

    // RFC 4122 v4 bit masks.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  return `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const createEmptyBlock = (kind: BlockKind = 'paragraph'): LegalContentBlock => ({
  id: generateClientId(),
  kind,
  text: kind === 'bullet_list' || kind === 'numbered_list' ? undefined : '',
  items: kind === 'bullet_list' || kind === 'numbered_list' ? [''] : undefined,
});

const createEmptyLocalizedDraft = (): LocalizedDraftDocument => ({
  title: '',
  description: '',
  blocks: [createEmptyBlock('paragraph')],
});

const normalizeBlocksForEditor = (blocks: LegalContentBlock[]): LegalContentBlock[] => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return [createEmptyBlock('paragraph')];
  }

  return blocks.map((block) => {
    if (block.kind === 'bullet_list' || block.kind === 'numbered_list') {
      return {
        ...block,
        items: block.items && block.items.length > 0 ? block.items : [''],
        text: undefined,
      };
    }

    return {
      ...block,
      text: block.text ?? '',
      items: undefined,
    };
  });
};

const serializeBlocksForApi = (blocks: LegalContentBlock[]): LegalContentBlock[] =>
  blocks.map((block) => {
    if (block.kind === 'bullet_list' || block.kind === 'numbered_list') {
      return {
        id: block.id,
        kind: block.kind,
        items: (block.items || []).map((item) => item.trim()).filter(Boolean),
      };
    }

    return {
      id: block.id,
      kind: block.kind,
      text: (block.text || '').trim(),
    };
  });

const createLocalizedDraft = (content?: { title?: string; description?: string | null; blocks?: LegalContentBlock[] }): LocalizedDraftDocument => ({
  title: content?.title || '',
  description: content?.description || '',
  blocks: normalizeBlocksForEditor(content?.blocks || []),
});

const isBlockMeaningful = (block: LegalContentBlock): boolean => {
  if (block.kind === 'bullet_list' || block.kind === 'numbered_list') {
    return (block.items || []).some((item) => item.trim().length > 0);
  }

  return Boolean(block.text?.trim());
};

const serializeMeaningfulBlocksForApi = (blocks: LegalContentBlock[]): LegalContentBlock[] =>
  serializeBlocksForApi(blocks).filter((block) =>
    block.kind === 'bullet_list' || block.kind === 'numbered_list'
      ? Boolean(block.items && block.items.length > 0)
      : Boolean(block.text),
  );

const hasLocalizedContent = (content: LocalizedDraftDocument): boolean =>
  Boolean(content.title.trim() || content.description.trim() || content.blocks.some(isBlockMeaningful));

const buildTranslationsPayload = (
  localizedContent: Record<EditorLocale, LocalizedDraftDocument>,
): Partial<Record<Exclude<EditorLocale, 'en'>, { title?: string; description?: string; blocks?: LegalContentBlock[] }>> => {
  const payload: Partial<Record<Exclude<EditorLocale, 'en'>, { title?: string; description?: string; blocks?: LegalContentBlock[] }>> = {};

  (['ar'] as const).forEach((locale) => {
    const content = localizedContent[locale];
    if (!hasLocalizedContent(content)) {
      return;
    }

    const localizedBlocks = serializeMeaningfulBlocksForApi(content.blocks);
    payload[locale] = {
      ...(content.title.trim() ? { title: content.title.trim() } : {}),
      ...(content.description.trim() ? { description: content.description.trim() } : {}),
      ...(localizedBlocks.length > 0 ? { blocks: localizedBlocks } : {}),
    };
  });

  return payload;
};

const toDraft = (document: LegalContent): DraftDocument => ({
  slug: document.slug,
  isActive: document.isActive,
  changeNote: '',
  localizedContent: {
    en: createLocalizedDraft({
      title: document.title,
      description: document.description,
      blocks: document.blocks,
    }),
    ar: createLocalizedDraft(document.translations?.ar),
  },
});

const newDocumentDraft = (): DraftDocument => ({
  slug: '',
  isActive: true,
  changeNote: '',
  localizedContent: {
    en: createEmptyLocalizedDraft(),
    ar: createEmptyLocalizedDraft(),
  },
});

const LegalContentManagement = () => {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [documents, setDocuments] = useState<LegalContent[]>([]);
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftDocument>(newDocumentDraft());
  const [editorLocale, setEditorLocale] = useState<EditorLocale>('en');
  const [createMode, setCreateMode] = useState(false);
  const [versions, setVersions] = useState<LegalContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const canReadLegal = hasAnyPermission([PERMISSIONS.ADMIN.LEGAL.READ, PERMISSIONS.ADMIN.LEGAL.MANAGE, ...LEGACY_READ_PERMISSIONS]);
  const canCreateLegal = hasAnyPermission([PERMISSIONS.ADMIN.LEGAL.CREATE, PERMISSIONS.ADMIN.LEGAL.MANAGE]);
  const canUpdateAnyLegal = hasAnyPermission([PERMISSIONS.ADMIN.LEGAL.UPDATE, PERMISSIONS.ADMIN.LEGAL.MANAGE]);
  const canDeleteLegal = hasAnyPermission([PERMISSIONS.ADMIN.LEGAL.DELETE, PERMISSIONS.ADMIN.LEGAL.MANAGE]);
  const canRestoreLegal = hasAnyPermission([PERMISSIONS.ADMIN.LEGAL.RESTORE, PERMISSIONS.ADMIN.LEGAL.MANAGE]);

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc.id === selectedId) || null,
    [documents, selectedId],
  );
  const currentLocalizedDraft = draft.localizedContent[editorLocale];
  const currentLocaleConfig = EDITOR_LOCALES.find((locale) => locale.value === editorLocale) || EDITOR_LOCALES[0];

  const canEditSelected = useMemo(() => {
    if (createMode) {
      return canCreateLegal;
    }
    if (!selectedDocument) {
      return false;
    }
    if (selectedDocument.isDeleted) {
      return false;
    }
    if (canUpdateAnyLegal) {
      return true;
    }
    const legacyPermission = LEGACY_UPDATE_PERMISSION_BY_SLUG[selectedDocument.slug];
    return legacyPermission ? hasPermission(legacyPermission) : false;
  }, [createMode, canCreateLegal, selectedDocument, canUpdateAnyLegal, hasPermission]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return documents;
    }
    return documents.filter(
      (doc) => doc.title.toLowerCase().includes(query) || doc.slug.toLowerCase().includes(query),
    );
  }, [documents, search]);

  const loadDocuments = useCallback(async () => {
    if (!canReadLegal) {
      return;
    }
    try {
      setLoading(true);
      const result = await legalContentService.getAllLegalContent({ includeDeleted });
      setDocuments(result);
    } catch (error) {
      console.error('Failed to load legal content documents', error);
      toast.error('Failed to load legal content documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [canReadLegal, includeDeleted]);

  const loadVersions = useCallback(
    async (documentId: string) => {
      try {
        setVersionsLoading(true);
        const result = await legalContentService.getLegalContentVersions(documentId);
        setVersions(result);
      } catch (error) {
        console.error('Failed to load legal content versions', error);
        setVersions([]);
      } finally {
        setVersionsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (createMode) {
      return;
    }

    if (selectedId && documents.some((doc) => doc.id === selectedId)) {
      return;
    }

    if (documents.length > 0) {
      setSelectedId(documents[0].id);
    } else {
      setSelectedId(null);
      setDraft(newDocumentDraft());
      setVersions([]);
    }
  }, [documents, selectedId, createMode]);

  useEffect(() => {
    if (createMode) {
      setVersions([]);
      return;
    }

    if (!selectedDocument) {
      setDraft(newDocumentDraft());
      setVersions([]);
      return;
    }

    setDraft(toDraft(selectedDocument));
    void loadVersions(selectedDocument.id);
  }, [selectedDocument, createMode, loadVersions]);

  const startCreateMode = () => {
    if (!canCreateLegal) {
      return;
    }
    setEditorLocale('en');
    setCreateMode(true);
    setSelectedId(null);
    setDraft(newDocumentDraft());
    setVersions([]);
  };

  const cancelCreateMode = () => {
    setEditorLocale('en');
    setCreateMode(false);
    if (documents.length > 0) {
      setSelectedId(documents[0].id);
    }
  };

  const updateCurrentLocalizedDraft = (updater: (content: LocalizedDraftDocument) => LocalizedDraftDocument) => {
    setDraft((prev) => ({
      ...prev,
      localizedContent: {
        ...prev.localizedContent,
        [editorLocale]: updater(prev.localizedContent[editorLocale]),
      },
    }));
  };

  const updateBlockKind = (index: number, kind: BlockKind) => {
    updateCurrentLocalizedDraft((content) => {
      const next = [...content.blocks];
      const existing = next[index];
      const updated: LegalContentBlock = {
        id: existing.id || generateClientId(),
        kind,
      };
      if (kind === 'bullet_list' || kind === 'numbered_list') {
        updated.items = existing.items && existing.items.length > 0 ? existing.items : [''];
      } else {
        updated.text = existing.text || '';
      }
      next[index] = updated;
      return { ...content, blocks: next };
    });
  };

  const updateBlockText = (index: number, text: string) => {
    updateCurrentLocalizedDraft((content) => {
      const next = [...content.blocks];
      next[index] = {
        ...next[index],
        text,
      };
      return { ...content, blocks: next };
    });
  };

  const updateBlockItems = (index: number, lines: string) => {
    const items = lines.split('\n');
    updateCurrentLocalizedDraft((content) => {
      const next = [...content.blocks];
      next[index] = {
        ...next[index],
        items,
      };
      return { ...content, blocks: next };
    });
  };

  const addBlock = (kind: BlockKind = 'paragraph') => {
    updateCurrentLocalizedDraft((content) => ({
      ...content,
      blocks: [...content.blocks, createEmptyBlock(kind)],
    }));
  };

  const removeBlock = (index: number) => {
    updateCurrentLocalizedDraft((content) => {
      const next = content.blocks.filter((_, i) => i !== index);
      return {
        ...content,
        blocks: next.length > 0 ? next : [createEmptyBlock('paragraph')],
      };
    });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    updateCurrentLocalizedDraft((content) => {
      const target = index + direction;
      if (target < 0 || target >= content.blocks.length) {
        return content;
      }
      const next = [...content.blocks];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...content, blocks: next };
    });
  };

  const validateLocalizedDraft = (content: LocalizedDraftDocument, label: string, required: boolean): boolean => {
    const meaningfulBlocks = serializeMeaningfulBlocksForApi(content.blocks);
    const hasMeaningfulContentForLocale = hasLocalizedContent(content);

    if (!required && !hasMeaningfulContentForLocale) {
      return true;
    }

    if (!content.title.trim()) {
      toast.error(`${label} title is required`);
      return false;
    }

    if (meaningfulBlocks.length === 0) {
      toast.error(`${label} content blocks are required`);
      return false;
    }

    const hasInvalidBlock = serializeBlocksForApi(content.blocks).some((block) => {
      if (block.kind === 'bullet_list' || block.kind === 'numbered_list') {
        return !block.items || block.items.length === 0;
      }
      return !block.text;
    });

    if (hasInvalidBlock) {
      toast.error(`Every ${label.toLowerCase()} block must contain content`);
      return false;
    }

    return true;
  };

  const validateDraft = (): boolean => {
    if (!draft.slug.trim()) {
      toast.error('Slug is required');
      return false;
    }

    return (
      validateLocalizedDraft(draft.localizedContent.en, 'English', true) &&
      validateLocalizedDraft(draft.localizedContent.ar, 'Arabic', false)
    );
  };

  const saveDocument = async () => {
    if (!canEditSelected) {
      return;
    }
    if (!validateDraft()) {
      return;
    }

    try {
      setSaving(true);
      const englishContent = draft.localizedContent.en;
      const payload = {
        slug: draft.slug.trim(),
        title: englishContent.title.trim(),
        description: englishContent.description.trim() || undefined,
        blocks: serializeMeaningfulBlocksForApi(englishContent.blocks),
        translations: buildTranslationsPayload(draft.localizedContent),
        isActive: draft.isActive,
        changeNote: draft.changeNote.trim() || undefined,
      };

      if (createMode) {
        const created = await legalContentService.createLegalContent(payload);
        toast.success('Legal document created');
        setCreateMode(false);
        await loadDocuments();
        setSelectedId(created.id);
      } else if (selectedDocument) {
        const updated = await legalContentService.updateLegalContentById(selectedDocument.id, {
          title: payload.title,
          description: payload.description,
          blocks: payload.blocks,
          translations: payload.translations,
          isActive: payload.isActive,
          changeNote: payload.changeNote,
        });
        toast.success('Legal document updated');
        await loadDocuments();
        setSelectedId(updated.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save legal document');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedDocument = async () => {
    if (!selectedDocument || !canDeleteLegal || selectedDocument.isDeleted) {
      return;
    }

    try {
      setSaving(true);
      await legalContentService.deleteLegalContentById(selectedDocument.id);
      toast.success('Legal document deleted');
      await loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete legal document');
    } finally {
      setSaving(false);
    }
  };

  const restoreSelectedDocument = async () => {
    if (!selectedDocument || !canRestoreLegal || !selectedDocument.isDeleted) {
      return;
    }

    try {
      setSaving(true);
      await legalContentService.restoreLegalContentById(selectedDocument.id);
      toast.success('Legal document restored');
      await loadDocuments();
      setSelectedId(selectedDocument.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to restore legal document');
    } finally {
      setSaving(false);
    }
  };

  const revertToVersion = async (versionId: string) => {
    if (!selectedDocument || !canEditSelected) {
      return;
    }

    try {
      setSaving(true);
      await legalContentService.revertLegalContentVersion(
        selectedDocument.id,
        versionId,
        draft.changeNote.trim() || 'Reverted from version history',
      );
      toast.success('Document reverted successfully');
      await loadDocuments();
      setSelectedId(selectedDocument.id);
      await loadVersions(selectedDocument.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revert document version');
    } finally {
      setSaving(false);
    }
  };

  if (!canReadLegal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Content</CardTitle>
          <CardDescription>You do not have access to legal content management.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Legal Content Studio</CardTitle>
          <CardDescription>
            Create and manage legal documents with block editing, version history, and safe delete/restore.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Documents</CardTitle>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or slug"
            />
            <div className="hidden items-center justify-between rounded-md border p-3">
              <Label htmlFor="show-deleted-toggle">Show Deleted</Label>
              <Switch
                id="show-deleted-toggle"
                checked={includeDeleted}
                onCheckedChange={(checked) => setIncludeDeleted(checked)}
              />
            </div>
            {canCreateLegal && (
              <Button type="button" onClick={startCreateMode} className="hidden w-full">
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading documents...</p>
            ) : filteredDocuments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No legal documents found.</p>
            ) : (
              filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setCreateMode(false);
                    setSelectedId(doc.id);
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedId === doc.id && !createMode ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{doc.title}</p>
                    <Badge variant={doc.isDeleted ? 'destructive' : doc.isActive ? 'default' : 'secondary'}>
                      {doc.isDeleted ? 'Deleted' : doc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate text-xs">{doc.slug}</p>
                  <p className="text-muted-foreground mt-1 text-[11px]">Version {doc.version}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{createMode ? 'Create Legal Document' : selectedDocument?.title || 'Document Editor'}</CardTitle>
              <CardDescription>
                {createMode
                  ? 'Create a new legal page type with custom slug and block content.'
                  : 'Edit content blocks, publish state, and change notes.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legal-slug">Slug</Label>
                  <Input
                    id="legal-slug"
                    value={draft.slug}
                    disabled={!createMode || saving}
                    onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))}
                    placeholder="example: cookie-policy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal-title">Title</Label>
                  <Input
                    id="legal-title"
                    value={currentLocalizedDraft.title}
                    disabled={!canEditSelected || saving}
                    onChange={(event) =>
                      updateCurrentLocalizedDraft((content) => ({ ...content, title: event.target.value }))
                    }
                    placeholder={`${currentLocaleConfig.label} document title`}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Tabs value={editorLocale} onValueChange={(value) => setEditorLocale(value as EditorLocale)}>
                  <TabsList className="grid w-full grid-cols-2">
                    {EDITOR_LOCALES.map((locale) => (
                      <TabsTrigger key={locale.value} value={locale.value}>
                        {locale.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="text-muted-foreground rounded-md border bg-slate-50 px-3 py-2 text-sm">
                  {currentLocaleConfig.helper}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal-description">Description</Label>
                <Textarea
                  id="legal-description"
                  value={currentLocalizedDraft.description}
                  disabled={!canEditSelected || saving}
                  onChange={(event) =>
                    updateCurrentLocalizedDraft((content) => ({ ...content, description: event.target.value }))
                  }
                  placeholder={`Short ${currentLocaleConfig.label.toLowerCase()} description`}
                  className="min-h-24"
                />
              </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="legal-active-toggle">Published</Label>
                  <Switch
                  id="legal-active-toggle"
                  checked={draft.isActive}
                  disabled={!canEditSelected || saving}
                  onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>

              <Separator />

                <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{currentLocaleConfig.label} Content Blocks</h3>
                  {canEditSelected && (
                    <Button type="button" variant="outline" size="sm" onClick={() => addBlock('paragraph')} className="w-full sm:w-auto">
                      <Plus className="mr-2 h-3 w-3" />
                      Add Block
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {currentLocalizedDraft.blocks.map((block, index) => (
                    <div key={block.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={block.kind}
                          disabled={!canEditSelected || saving}
                          onChange={(event) => updateBlockKind(index, event.target.value as BlockKind)}
                          className="h-9 w-full rounded-md border px-2 text-sm sm:w-auto"
                        >
                          {BLOCK_KIND_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        {canEditSelected && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={index === 0 || saving}
                              onClick={() => moveBlock(index, -1)}
                              className="flex-1 sm:flex-none"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={index === currentLocalizedDraft.blocks.length - 1 || saving}
                              onClick={() => moveBlock(index, 1)}
                              className="flex-1 sm:flex-none"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={saving}
                              onClick={() => removeBlock(index)}
                              className="flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>

                      {block.kind === 'bullet_list' || block.kind === 'numbered_list' ? (
                        <Textarea
                          value={(block.items || []).join('\n')}
                          disabled={!canEditSelected || saving}
                          onChange={(event) => updateBlockItems(index, event.target.value)}
                          placeholder="One list item per line"
                          className="min-h-24"
                        />
                      ) : (
                        <Textarea
                          value={block.text || ''}
                          disabled={!canEditSelected || saving}
                          onChange={(event) => updateBlockText(index, event.target.value)}
                          placeholder="Block content"
                          className={block.kind === 'heading' ? 'min-h-16' : 'min-h-24'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="change-note">Change Note (for audit trail)</Label>
                <Input
                  id="change-note"
                  value={draft.changeNote}
                  disabled={!canEditSelected || saving}
                  onChange={(event) => setDraft((prev) => ({ ...prev, changeNote: event.target.value }))}
                  placeholder="Example: Updated cancellation timeline section"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {canEditSelected && (
                  <Button type="button" onClick={saveDocument} disabled={saving} className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : createMode ? 'Create Document' : 'Save Changes'}
                  </Button>
                )}

                {createMode && (
                  <Button type="button" variant="outline" onClick={cancelCreateMode} disabled={saving} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                )}

                {!createMode && selectedDocument && canDeleteLegal && !selectedDocument.isDeleted && (
                  <Button type="button" variant="destructive" onClick={deleteSelectedDocument} disabled={saving} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}

                {!createMode && selectedDocument && canRestoreLegal && selectedDocument.isDeleted && (
                  <Button type="button" variant="secondary" onClick={restoreSelectedDocument} disabled={saving} className="w-full sm:w-auto">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {!createMode && selectedDocument && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <CardTitle className="text-base">Version History</CardTitle>
                </div>
                <CardDescription>Audit trail of published changes and manual reversions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {versionsLoading ? (
                  <p className="text-muted-foreground text-sm">Loading versions...</p>
                ) : versions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No versions found.</p>
                ) : (
                  versions.map((version) => (
                    <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">v{version.version}</p>
                        <p className="text-muted-foreground text-xs">
                          {version.changeNote || 'No change note'} - {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {canEditSelected && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => revertToVersion(version.id)}
                          disabled={saving}
                          className="w-full sm:w-auto"
                        >
                          Revert
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalContentManagement;
