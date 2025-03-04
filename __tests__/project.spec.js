const fs = require('fs');
const path = require('path');
const nock = require('nock');
const sharp = require('sharp');
const helpers = require('./helpers');
const project = require('../lib/project');
const pkg = require('../package.json');


describe('project', () => {
  it('should reject when project dir not in expected format', () => {
    const p = helpers.resolveFixturePath('a-project');
    expect.assertions(2);
    return project(p)
      .catch((err) => {
        expect(err.message).toBe('Expected project dir to be in 00-slug format and got a-project');
        expect(err.path).toBe(p);
      });
  });

  it('should reject when language not supported', () => {
    const p = helpers.resolveFixturePath('01-foo');
    expect.assertions(1);
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'en-GB',
    })
      .catch((err) => {
        expect(err.message).toBe('Unsupported language: en');
      });
  });

  it('should reject when dir doesnt exist', () => {
    expect.assertions(2);
    return project('01-foo', { locale: 'es-ES' })
      .catch((err) => {
        expect(err.message).toMatch(/no such file or directory/);
        expect(err.code).toBe('ENOENT');
      });
  });

  it('should reject when README.md is empty', () => {
    const p = helpers.resolveFixturePath('00-course-empty');
    expect.assertions(2);
    return project(p, { locale: 'es-ES' })
      .catch((err) => {
        expect(err.message).toBe('Project README.md is empty');
        expect(err.path).toBe(path.join(p, 'README.md'));
      });
  });

  it('should reject when README.md doesnt start with h1', () => {
    const p = helpers.resolveFixturePath('01-a-project-without-a-title');
    const p2 = helpers.resolveFixturePath('01-a-project-without-a-bad-title');
    return project(p, { locale: 'es-ES' })
      .then(() => {
        throw new Error('This should never happen');
      })
      .catch((err) => {
        expect(err.message).toBe('Expected README.md to start with h1 and instead saw heading (depth: 2)');
        expect(err.path).toBe(path.join(p, 'README.md'));

        return project(p2, { locale: 'es-ES' });
      })
      .then(() => {
        throw new Error('This should never happen');
      })
      .catch((err) => {
        expect(err.message).toBe('Expected README.md to start with h1 and instead saw paragraph');
        expect(err.path).toBe(path.join(p2, 'README.md'));
      });
  });

  it('should parse portuguese project', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-pt-translation');
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'pt-BR',
      suffix: 'pt',
    })
      .then(({ createdAt, parserVersion, ...parsed }) => {
        expect(parserVersion).toBe(pkg.version);
        expect(parsed.slug).toBe('a-project-with-pt-translation-pt');
        expect(parsed.locale).toBe('pt-BR');
        expect(parsed).toMatchSnapshot();
      });
  });

  it('should reject when unknown learning objective', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-unknown-learning-objective');
    expect.assertions(2);
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      lo: path.join(__dirname, 'fixtures', 'learning-objectives'),
    })
      .catch((err) => {
        expect(err.message).toBe('Unknown learning objectives: html/foo.');
        expect(err.path).toBe(path.join(p, 'README.md'));
      });
  });

  it('should parse a project with learning objectives without validating against known list', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-learning-objectives');
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
    })
      .then(({ parserVersion, createdAt, ...parsed }) => {
        expect(parserVersion).toBe(pkg.version);
        expect(parsed).toMatchSnapshot();
      });
  });

  it('should parse a project with learning objectives validating against known list', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-learning-objectives');
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      lo: path.join(__dirname, 'fixtures', 'learning-objectives'),
    })
      .then(({ parserVersion, createdAt, ...parsed }) => {
        expect(parserVersion).toBe(pkg.version);
        expect(parsed).toMatchSnapshot();
      });
  });

  it('should parse a project with learning objectives', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-learning-objectives');
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
    })
      .then(({ parserVersion, createdAt, ...parsed }) => {
        expect(parserVersion).toBe(pkg.version);
        expect(parsed).toMatchSnapshot();
      });
  });

  it('should expand learning objectives children when only parent is mentioned', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-lo-needing-expansion');
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      lo: path.join(__dirname, 'fixtures', 'learning-objectives'),
    })
      .then((result) => {
        expect(result.learningObjectives).toMatchSnapshot();
      });
  });

  it('should extract first paragraph of _resumen del proyecto_ as summary', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-summary');
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      lo: path.join(__dirname, 'fixtures', 'learning-objectives'),
    })
      .then((result) => {
        expect(result.summary).toMatchSnapshot();
      });
  });

  it('should extract first paragraph of _resumo do projeto_ as summary', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-summary');
    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'pt-BR',
      lo: path.join(__dirname, 'fixtures', 'learning-objectives'),
    })
      .then((result) => {
        expect(result.summary).toMatchSnapshot();
      });
  });

  it('should create a thumbnail when file not present and has cover', () => {
    const p = helpers.resolveFixturePath('01-a-project-without-thumb');
    const thumbPath = path.join(p, 'thumb.png');

    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }

    const scope = nock('https://www.101computing.net')
      .get('/wp/wp-content/uploads/Luhn-Algorithm.png')
      .reply(200, 'xxxx');

    return project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      lo: path.join(__dirname, 'fixtures', 'learning-objectives'),
    })
      .then((result) => {
        expect(fs.existsSync(thumbPath)).toBe(true);
        expect(typeof result.thumb).toBe('string');
        expect(result.thumb).toMatch(/^data:image\/png;base64,/);
        fs.unlinkSync(thumbPath);
        scope.done();
        expect(sharp).toHaveBeenCalled();
        expect(sharp().resize).toHaveBeenCalledWith(395);
        expect(sharp().resize().toBuffer).toHaveBeenCalled();
      });
  });

  it('should try to create a thumbnail and fail when HTTP status not 200', () => {
    const p = helpers.resolveFixturePath('01-a-project-without-thumb-again');
    const thumbPath = path.join(p, 'thumb.png');

    expect.assertions(2);
    expect(fs.existsSync(thumbPath)).toBe(false);

    nock('https://www.101computing.net')
      .get('/wp/wp-content/uploads/Luhn-Algorithm.png')
      .reply(404, '');

    return expect(project(p, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      lo: path.join(__dirname, 'fixtures', 'learning-objectives'),
    })).rejects.toThrow('HTTP error 404');
  });
});
