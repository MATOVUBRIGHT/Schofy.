const ID_FORMAT_KEY = 'schofy_id_format';

export interface IdFormat {
  pattern: string;
  prefix: string;
  useNameInitials: boolean;
  useRandomNumbers: boolean;
  randomNumberLength: number;
  useYear: boolean;
  useSequential: boolean;
  separator: string;
  customExample: string;
}

const defaultFormats: Record<string, IdFormat> = {
  sequential: {
    pattern: 'ADM/YYYY/####',
    prefix: 'ADM',
    useNameInitials: false,
    useRandomNumbers: false,
    randomNumberLength: 4,
    useYear: true,
    useSequential: true,
    separator: '/',
    customExample: 'ADM/2026/0001',
  },
  initials_random: {
    pattern: 'INI####',
    prefix: '',
    useNameInitials: true,
    useRandomNumbers: true,
    randomNumberLength: 4,
    useYear: false,
    useSequential: false,
    separator: '',
    customExample: 'JOKI0001',
  },
  mixed: {
    pattern: 'PRE_INI_YYYY_####',
    prefix: 'SCH',
    useNameInitials: true,
    useRandomNumbers: false,
    randomNumberLength: 4,
    useYear: true,
    useSequential: true,
    separator: '_',
    customExample: 'SCH_JOKI_2026_0001',
  },
};

export function getSavedIdFormat(): IdFormat {
  try {
    const saved = localStorage.getItem(ID_FORMAT_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load ID format:', e);
  }
  return defaultFormats.sequential;
}

export function saveIdFormat(format: IdFormat): void {
  localStorage.setItem(ID_FORMAT_KEY, JSON.stringify(format));
}

export function resetIdFormat(): void {
  localStorage.removeItem(ID_FORMAT_KEY);
}

export function getPresetFormats(): Record<string, IdFormat> {
  return defaultFormats;
}

export function parsePattern(pattern: string): IdFormat {
  const parts = pattern.split(/[\/\-_]/);
  const separators = pattern.match(/[\/\-_]/g) || [];
  
  const useYear = pattern.includes('YYYY') || pattern.includes('YY');
  const useSequential = pattern.includes('####') || pattern.includes('####');
  const useRandomNumbers = pattern.includes('****');
  const useNameInitials = pattern.includes('INI');

  const prefix = parts[0]?.replace('INI', '').replace('YYYY', '').replace('YY', '').replace('####', '').replace('****', '') || '';

  let randomNumberLength = 4;
  const randomMatch = pattern.match(/\*{4,}/);
  if (randomMatch) {
    randomNumberLength = randomMatch[0].length;
  }

  const separator = separators[0] || '';

  return {
    pattern,
    prefix,
    useNameInitials,
    useRandomNumbers,
    randomNumberLength,
    useYear,
    useSequential,
    separator,
    customExample: generateExampleId({ ...getSavedIdFormat(), pattern }),
  };
}

function generateRandomNumber(length: number): string {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getNameInitials(firstName: string, lastName: string): string {
  const first = firstName?.trim()?.[0]?.toUpperCase() || '';
  const last = lastName?.trim()?.[0]?.toUpperCase() || '';
  return first + last;
}

function getNextSequenceNumber(prefix: string, existingValues: string[]): string {
  const matcher = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[\\/\\_\\-])?(.*)$`);
  
  let highestSequence = 0;
  for (const value of existingValues) {
    const match = value.match(matcher);
    if (match) {
      const numPart = match[1].replace(/\D/g, '');
      if (numPart) {
        highestSequence = Math.max(highestSequence, parseInt(numPart, 10));
      }
    }
  }
  return String(highestSequence + 1).padStart(4, '0');
}

export function generateStudentId(
  firstName: string,
  lastName: string,
  existingValues: string[] = []
): string {
  const format = getSavedIdFormat();
  let result = format.pattern;

  const year = new Date().getFullYear();
  const yearStr = format.useYear ? String(year) : '';
  const twoDigitYear = String(year).slice(-2);

  result = result.replace(/YYYY/g, yearStr);
  result = result.replace(/YY/g, twoDigitYear);

  if (format.useNameInitials) {
    const initials = getNameInitials(firstName, lastName);
    result = result.replace(/INI/g, initials);
  } else if (format.prefix && !result.startsWith(format.prefix)) {
    const prefixIndex = result.indexOf(format.prefix);
    if (prefixIndex > 0) {
      const beforePrefix = result.substring(0, prefixIndex);
      result = beforePrefix + result.substring(prefixIndex);
    }
  }

  if (format.useRandomNumbers) {
    const randomNum = generateRandomNumber(format.randomNumberLength);
    result = result.replace(/\*+/g, randomNum);
  }

  if (format.useSequential) {
    const seqNum = getNextSequenceNumber(result, existingValues);
    result = result.replace(/#+/g, seqNum);
  }

  if (result.includes('#') || result.includes('*')) {
    result = result.replace(/#/g, '0').replace(/\*/g, '0');
  }

  result = result.replace(/[\/\-_]{2,}/g, format.separator || '_');

  let finalResult = result.toUpperCase();
  
  const allExisting = new Set(existingValues);
  
  let attempts = 0;
  const maxAttempts = 100;
  
  while (allExisting.has(finalResult) && attempts < maxAttempts) {
    const suffix = generateRandomNumber(4);
    const parts = finalResult.split(/[\/\-_]/);
    const lastPart = parts[parts.length - 1];
    
    if (/^\d+$/.test(lastPart)) {
      parts[parts.length - 1] = lastPart + suffix;
      finalResult = parts.join(format.separator || '/').toUpperCase();
    } else {
      finalResult = (finalResult + suffix).toUpperCase();
    }
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = generateRandomNumber(2);
    finalResult = (finalResult.slice(0, -4) + timestamp.slice(-4) + suffix).toUpperCase();
  }

  return finalResult;
}

export function generateExampleId(format?: Partial<IdFormat>): string {
  const f = format || getSavedIdFormat();
  let result = f.pattern || '';

  result = result.replace(/YYYY/g, '2026');
  result = result.replace(/YY/g, '26');
  result = result.replace(/INI/g, 'JOKI');

  if (f.useRandomNumbers) {
    result = result.replace(/\*+/g, generateRandomNumber(f.randomNumberLength || 4));
  }
  if (f.useSequential) {
    result = result.replace(/#+/g, '0001');
  }

  return result.toUpperCase();
}

export function extractFormatFromId(id: string): IdFormat | null {
  if (!id || id.length < 3) return null;

  const parts = id.split(/[\/\-_]/);
  if (parts.length < 2) return null;

  let pattern = '';
  const separators: string[] = [];
  
  for (let i = 0; i < id.length; i++) {
    const char = id[i];
    if (/[\/\-_]/.test(char)) {
      separators.push(char);
    }
  }

  const idParts = id.split(/[\/\-_]/);
  const tempPatternParts: string[] = [];
  
  for (let i = 0; i < idParts.length; i++) {
    const part = idParts[i];
    
    if (/^\d{4}$/.test(part)) {
      tempPatternParts.push('YYYY');
    } else if (/^\d{2}$/.test(part) && i < idParts.length - 1) {
      tempPatternParts.push('YY');
    } else if (/^\d+$/.test(part) && part.length >= 4) {
      const hashCount = '#'.repeat(part.length);
      tempPatternParts.push(hashCount);
    } else if (/^[A-Z]{2,4}$/.test(part) && i === 0) {
      tempPatternParts.push(part);
    } else {
      tempPatternParts.push(part);
    }
  }

  pattern = tempPatternParts.join(separators[0] || '/');
  
  return {
    pattern,
    prefix: idParts[0] || '',
    useNameInitials: /^[A-Z]{2,4}$/.test(idParts.find(p => /^[A-Z]{2,4}$/.test(p)) || ''),
    useRandomNumbers: /\d{3,}/.test(idParts.find(p => /\d{3,}/.test(p)) || ''),
    randomNumberLength: 4,
    useYear: pattern.includes('YYYY') || pattern.includes('YY'),
    useSequential: pattern.includes('#'),
    separator: separators[0] || '/',
    customExample: id,
  };
}
