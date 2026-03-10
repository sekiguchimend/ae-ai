/**
 * Unit Tests for Validation Functions
 */

import {
  validateJSXSecurity,
  sanitizeJSX,
  validateLayerName,
  validateAngleRange,
  validateOpacity,
  validateScale,
  validateCharacterName,
  validateEmail,
} from '../validation';

describe('validateJSXSecurity', () => {
  it('should detect system.callSystem', () => {
    const code = 'system.callSystem("rm -rf /");';
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(false);
    expect(result.detectedCommands).toContain('system.callSystem');
  });

  it('should detect File.remove', () => {
    const code = 'var f = new File("/path"); f.remove();';
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(false);
    expect(result.detectedCommands).toContain('File.remove');
  });

  it('should detect File.execute', () => {
    const code = 'File.execute("/bin/bash script.sh");';
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(false);
    expect(result.detectedCommands).toContain('File.execute');
  });

  it('should detect Folder.remove', () => {
    const code = 'Folder.remove();';
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(false);
    expect(result.detectedCommands).toContain('Folder.remove');
  });

  it('should pass safe code', () => {
    const code = `
      var comp = app.project.activeItem;
      var layer = comp.layer(1);
      layer.transform.position.setValue([100, 100]);
    `;
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(true);
    expect(result.detectedCommands).toHaveLength(0);
  });

  it('should detect $.evalFile', () => {
    const code = '$.evalFile("/path/to/script.jsx");';
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(false);
    expect(result.detectedCommands).toContain('$.evalFile');
  });

  it('should detect eval(', () => {
    const code = 'eval("malicious code");';
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(false);
    expect(result.detectedCommands).toContain('eval(');
  });

  it('should detect multiple dangerous commands', () => {
    const code = 'system.callSystem("ls"); File.remove();';
    const result = validateJSXSecurity(code);
    expect(result.isValid).toBe(false);
    expect(result.detectedCommands).toContain('system.callSystem');
    expect(result.detectedCommands).toContain('File.remove');
  });
});

describe('sanitizeJSX', () => {
  it('should block dangerous commands', () => {
    const code = 'system.callSystem("ls"); var x = 1;';
    const result = sanitizeJSX(code);
    expect(result).toContain('/* BLOCKED:');
    expect(result).toContain('var x = 1');
  });

  it('should leave safe code unchanged', () => {
    const code = 'var layer = comp.layer(1);';
    const result = sanitizeJSX(code);
    expect(result).toBe(code);
  });

  it('should block multiple dangerous commands', () => {
    const code = 'File.remove(); Folder.remove();';
    const result = sanitizeJSX(code);
    expect(result).toContain('/* BLOCKED: File.remove */');
    expect(result).toContain('/* BLOCKED: Folder.remove */');
  });
});

describe('validateLayerName', () => {
  it('should accept valid layer names', () => {
    expect(validateLayerName('Layer 1')).toBe(true);
    expect(validateLayerName('Arm_Left')).toBe(true);
    expect(validateLayerName('Body-Main')).toBe(true);
  });

  it('should reject empty names', () => {
    expect(validateLayerName('')).toBe(false);
  });

  it('should reject whitespace-only names', () => {
    expect(validateLayerName('   ')).toBe(false);
  });

  it('should reject names that are too long', () => {
    const longName = 'a'.repeat(256);
    expect(validateLayerName(longName)).toBe(false);
  });

  it('should accept names at max length', () => {
    const maxName = 'a'.repeat(255);
    expect(validateLayerName(maxName)).toBe(true);
  });
});

describe('validateAngleRange', () => {
  it('should accept valid angle ranges', () => {
    expect(validateAngleRange(0, 180)).toBe(true);
    expect(validateAngleRange(-180, 180)).toBe(true);
    expect(validateAngleRange(-360, 360)).toBe(true);
  });

  it('should reject when min is greater than max', () => {
    expect(validateAngleRange(180, 0)).toBe(false);
    expect(validateAngleRange(100, -100)).toBe(false);
  });

  it('should reject out-of-range angles', () => {
    expect(validateAngleRange(-361, 0)).toBe(false);
    expect(validateAngleRange(0, 361)).toBe(false);
  });

  it('should accept same min and max', () => {
    expect(validateAngleRange(90, 90)).toBe(true);
  });
});

describe('validateOpacity', () => {
  it('should accept valid opacity values', () => {
    expect(validateOpacity(0)).toBe(true);
    expect(validateOpacity(50)).toBe(true);
    expect(validateOpacity(100)).toBe(true);
  });

  it('should reject out-of-range values', () => {
    expect(validateOpacity(-1)).toBe(false);
    expect(validateOpacity(101)).toBe(false);
  });

  it('should accept decimal values within range', () => {
    expect(validateOpacity(50.5)).toBe(true);
    expect(validateOpacity(0.1)).toBe(true);
    expect(validateOpacity(99.9)).toBe(true);
  });
});

describe('validateScale', () => {
  it('should accept valid scale values', () => {
    expect(validateScale(100)).toBe(true);
    expect(validateScale(50)).toBe(true);
    expect(validateScale(200)).toBe(true);
  });

  it('should reject negative values', () => {
    expect(validateScale(-10)).toBe(false);
    expect(validateScale(-0.1)).toBe(false);
  });

  it('should accept zero', () => {
    expect(validateScale(0)).toBe(true);
  });

  it('should accept very large values', () => {
    expect(validateScale(10000)).toBe(true);
  });
});

describe('validateCharacterName', () => {
  it('should accept valid names', () => {
    expect(validateCharacterName('Character A').isValid).toBe(true);
    expect(validateCharacterName('キャラクター1').isValid).toBe(true);
    expect(validateCharacterName('Test_Character-01').isValid).toBe(true);
  });

  it('should reject empty names', () => {
    expect(validateCharacterName('').isValid).toBe(false);
    expect(validateCharacterName('   ').isValid).toBe(false);
  });

  it('should provide error message for empty names', () => {
    const result = validateCharacterName('');
    expect(result.error).toBe('キャラクター名は必須です');
  });

  it('should reject names that are too long', () => {
    const longName = 'a'.repeat(101);
    const result = validateCharacterName(longName);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('キャラクター名は100文字以内にしてください');
  });

  it('should accept names at max length', () => {
    const maxName = 'a'.repeat(100);
    expect(validateCharacterName(maxName).isValid).toBe(true);
  });

  it('should reject names with invalid characters', () => {
    expect(validateCharacterName('Name/Invalid').isValid).toBe(false);
    expect(validateCharacterName('Name\\Invalid').isValid).toBe(false);
    expect(validateCharacterName('Name<Invalid>').isValid).toBe(false);
    expect(validateCharacterName('Name:Invalid').isValid).toBe(false);
  });

  it('should provide error message for invalid characters', () => {
    const result = validateCharacterName('Name/Invalid');
    expect(result.error).toBe('使用できない文字が含まれています');
  });
});

describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.jp')).toBe(true);
    expect(validateEmail('user+tag@example.org')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('no@')).toBe(false);
  });

  it('should reject emails with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false);
    expect(validateEmail('test@ example.com')).toBe(false);
  });

  it('should reject empty strings', () => {
    expect(validateEmail('')).toBe(false);
  });
});
