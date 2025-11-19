"use server";

export async function selectRandomParticipant(
  participants: string[]
): Promise<string | null> {
  if (participants.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * participants.length);
  return participants[randomIndex] || null;
}

