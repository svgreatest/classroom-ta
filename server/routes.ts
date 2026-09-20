import path from 'path';
import fs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import { LessonService } from './services/lessonService';
import { CompilerService } from './services/compilerService';
import { OptTracerService } from './services/optTracerService';
import { CodeExamplesService } from './services/codeExamplesService';
import { SlidevService } from './services/slidevService';
import { PdfExportService } from './services/pdfExportService';

export function createApiMiddleware(baseDir: string) {
  const lessonsRoot = path.resolve(baseDir, 'lessons');
  const examplesRoot = path.resolve(baseDir, 'code_examples');

  const lessonService = new LessonService(lessonsRoot);
  const compilerService = new CompilerService(lessonsRoot, examplesRoot);
  const optTracerService = new OptTracerService(baseDir);
  const codeExamplesService = new CodeExamplesService(examplesRoot);
  const slidevService = new SlidevService(baseDir, 3030);
  const pdfExportService = new PdfExportService(baseDir);

  // Auto-start Slidev server in background when in dev server mode
  if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
    try {
      slidevService.startSlidev();
    } catch (err) {
      console.warn('Could not auto-start Slidev:', err);
    }
  }

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost:3000'}`);
    const pathname = parsedUrl.pathname;

    // Helper: JSON response
    const sendJson = (statusCode: number, data: any) => {
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(data));
    };

    // Helper: Read JSON body
    const readBody = (callback: (body: any) => void) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => {
        try {
          callback(JSON.parse(data || '{}'));
        } catch {
          callback({});
        }
      });
    };

    // Handle OPTIONS CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Lessons API (/api/lessons)
    if (pathname === '/api/lessons') {
      if (req.method === 'GET') {
        const lessons = lessonService.getLessons();
        return sendJson(200, { lessons });
      }
      if (req.method === 'POST') {
        return readBody(body => {
          const { id, title, topic } = body;
          if (!id || !title) {
            return sendJson(400, { error: 'id and title are required' });
          }
          const result = lessonService.createLesson(id, title, topic);
          return sendJson(200, result);
        });
      }
    }

    // 2. Slides Markdown API (/api/slides)
    if (pathname === '/api/slides') {
      const lessonId = parsedUrl.searchParams.get('lessonId') || '01-avl-trees';
      if (req.method === 'GET') {
        const slides = lessonService.getSlides(lessonId);
        return sendJson(200, slides);
      }
      if (req.method === 'POST') {
        return readBody(body => {
          lessonService.saveSlides(lessonId, body.content || '');
          // Sync with Slidev active root
          slidevService.setLesson(lessonId);
          return sendJson(200, { success: true });
        });
      }
    }

    // 3. Slidev Control API (/api/slidev/set-lesson & /api/slidev/status)
    if (pathname === '/api/slidev/set-lesson' && req.method === 'POST') {
      return readBody(async body => {
        const lessonId = body.lessonId || '01-avl-trees';
        const result = await slidevService.setLessonAsync(lessonId);
        return sendJson(200, { ...result, port: slidevService.getSlidevPort() });
      });
    }

    if (pathname === '/api/slidev/status' && req.method === 'GET') {
      return sendJson(200, {
        port: slidevService.getSlidevPort(),
        currentLessonId: slidevService.getCurrentLessonId()
      });
    }

    // 4. Export PDF API (/api/export-pdf)
    if (pathname === '/api/export-pdf') {
      const lessonId = parsedUrl.searchParams.get('lessonId') || slidevService.getCurrentLessonId();
      
      // If client requests direct download file
      const download = parsedUrl.searchParams.get('download');
      if (download) {
        const filePath = path.resolve(baseDir, 'dist/exports', `${lessonId}-slides.pdf`);
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${lessonId}-slides.pdf"`);
          return fs.createReadStream(filePath).pipe(res);
        }
      }

      pdfExportService.exportLessonToPdf(lessonId, result => {
        if (result.success && result.fileName) {
          return sendJson(200, {
            success: true,
            downloadUrl: `/api/export-pdf?lessonId=${lessonId}&download=true`,
            fileName: result.fileName
          });
        }
        return sendJson(500, { success: false, error: result.error || 'Export failed' });
      });
      return;
    }

    // 5. Code Examples API (/api/code-examples)
    if (pathname === '/api/code-examples') {
      if (req.method === 'GET') {
        const file = parsedUrl.searchParams.get('file');
        if (file) {
          const fileData = codeExamplesService.getFileContent(file);
          return sendJson(200, fileData);
        }
        const categories = codeExamplesService.listCategories();
        return sendJson(200, { categories });
      }
      if (req.method === 'POST') {
        return readBody(body => {
          const { file, content } = body;
          if (!file) return sendJson(400, { error: 'file parameter is required' });
          codeExamplesService.saveFileContent(file, content);
          return sendJson(200, { success: true });
        });
      }
    }

    // 6. Code Examples Run API (/api/code-examples/run)
    if (pathname === '/api/code-examples/run' && req.method === 'POST') {
      return readBody(body => {
        const { file } = body;
        if (!file) return sendJson(400, { error: 'file is required' });
        compilerService.runExampleCode(file, result => {
          sendJson(200, result);
        });
      });
      return;
    }

    // 7. C Code Runner API (/api/run-c)
    if (pathname === '/api/run-c' && req.method === 'POST') {
      return readBody(body => {
        const files = body.files || {};
        const lessonId = body.lessonId || '01-avl-trees';
        compilerService.runLessonCode(lessonId, files, result => {
          sendJson(200, result);
        });
      });
      return;
    }

    // 8. OPT C Tracer API (JSONP & REST)
    if (pathname === '/api/opt/exec_c_jsonp') {
      const handleExecution = (userCode: string, callbackName: string) => {
        optTracerService.executeTracer(userCode, traceObj => {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(`${callbackName}(${JSON.stringify(traceObj)});`);
        });
      };

      if (req.method === 'POST') {
        return readBody(body => {
          const userCode = body.user_script || body.code || '';
          const callbackName = body.callback || 'callback';
          handleExecution(userCode, callbackName);
        });
      } else {
        const callbackName = parsedUrl.searchParams.get('callback') || 'callback';
        const userCode = parsedUrl.searchParams.get('user_script') || '';
        return handleExecution(userCode, callbackName);
      }
    }

    if (pathname === '/api/opt/exec_c' && req.method === 'POST') {
      return readBody(body => {
        const userCode = body.code || body.user_script || '';
        optTracerService.executeTracer(userCode, traceObj => {
          sendJson(200, traceObj);
        });
      });
      return;
    }

    if (pathname === '/api/opt/web_exec_c') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/plain');
      res.end('OK');
      return;
    }

    // 9. OnlinePythonTutor Static Assets (/opt-tutor)
    if (pathname.startsWith('/opt-tutor')) {
      return optTracerService.handleStaticTutor(req, res, next);
    }

    next();
  };
}
