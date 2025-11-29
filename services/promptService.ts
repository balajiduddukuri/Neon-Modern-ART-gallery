import { ArtConfig, SUBJECTS, COUNTS, NEON_COLORS, BACKGROUND_TEXTURES } from '../types';

function getRandomElement<T>(arr: T[] | readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const generateRandomConfig = (): ArtConfig => {
  const theme = getRandomElement(SUBJECTS);
  
  return {
    subject: theme.name,
    feature: theme.feature,
    color: getRandomElement(NEON_COLORS),
    count: getRandomElement(COUNTS),
    backgroundTexture: getRandomElement(BACKGROUND_TEXTURES)
  };
};

export const constructPrompt = (config: ArtConfig): string => {
  const { count, subject, feature, color, backgroundTexture } = config;
  
  // Constructing the sentence naturally
  const subjectPhrase = `${count} ${subject}`;

  return `A softly abstract, minimalistic painting of ${subjectPhrase} on a light gray-white canvas, bodies rendered in loose, cloudy brushstrokes of gray and white with subtle smudges and textures suggesting form and surrounding mist; small areas such as ${feature} glow with bright ${color} accents, creating a gentle focal point; the background is mostly empty, featuring ${backgroundTexture}, giving a dreamy, ethereal atmosphere and a modern, gallery-style aesthetic. High resolution, 8k.`;
};