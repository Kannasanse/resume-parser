import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const courseId = params.id;

    const { data, error } = await supabase
      .from('course_sources')
      .select('id,type,title,subtitle,url,token_count,metadata,created_at')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ sources: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('course sources GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const courseId = params.id;
    const contentType = request.headers.get('content-type') || '';

    let type, title, subtitle, url, extractedText, filePath, metadata;

    if (contentType.includes('multipart/form-data')) {
      // PDF upload
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

      const fileName = file.name || 'upload.pdf';
      const buffer = Buffer.from(await file.arrayBuffer());

      // Store file in Supabase Storage
      const storagePath = `${user.id}/${courseId}/${Date.now()}_${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('course-sources')
        .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false });

      if (uploadError) {
        console.warn('Storage upload failed, storing without file:', uploadError.message);
      }

      // Extract text with pdf-parse
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text || '';
        const pageCount = parsed.numpages || 0;
        title = fileName.replace(/\.pdf$/i, '');
        subtitle = `PDF · ${pageCount} page${pageCount !== 1 ? 's' : ''}`;
        metadata = { pages: pageCount, word_count: extractedText.split(/\s+/).length };
      } catch (parseErr) {
        console.warn('pdf-parse failed:', parseErr.message);
        extractedText = '';
        title = fileName.replace(/\.pdf$/i, '');
        subtitle = 'PDF';
        metadata = {};
      }

      type = 'pdf';
      filePath = storagePath;
      url = null;
    } else {
      // JSON: url or text type
      const body = await request.json();
      type = body.type;
      title = body.title?.trim();
      url = body.url?.trim();

      if (type === 'url') {
        if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

        // Fetch URL content
        try {
          const fetchRes = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Proflect/1.0)' },
            signal: AbortSignal.timeout(10000),
          });
          const html = await fetchRes.text();
          // Strip HTML tags for plain text
          extractedText = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .slice(0, 50000);

          const domain = new URL(url).hostname.replace('www.', '');
          title = title || domain;
          subtitle = `Web · ${domain}`;
          metadata = { source_domain: domain, word_count: extractedText.split(/\s+/).length };
        } catch (fetchErr) {
          console.warn('URL fetch failed:', fetchErr.message);
          extractedText = '';
          title = title || url;
          subtitle = 'URL (fetch failed)';
          metadata = {};
        }
      } else if (type === 'text') {
        const content = body.content?.trim();
        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });
        extractedText = content;
        title = title || 'Pasted text';
        subtitle = `Text · ${content.split(/\s+/).length} words`;
        metadata = { word_count: content.split(/\s+/).length };
        url = null;
      } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    }

    const tokenCount = Math.ceil((extractedText || '').length / 4);

    const { data: source, error: insertError } = await supabase
      .from('course_sources')
      .insert({
        course_id:      courseId,
        user_id:        user.id,
        type,
        title,
        subtitle,
        url:            url || null,
        file_path:      filePath || null,
        extracted_text: extractedText,
        token_count:    tokenCount,
        metadata,
      })
      .select('id,type,title,subtitle,url,token_count,metadata,created_at')
      .single();

    if (insertError) throw insertError;
    return NextResponse.json({ source }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('course sources POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
