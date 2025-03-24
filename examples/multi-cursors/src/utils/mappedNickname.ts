const animals = [
  "elephant",
  "penguin",
  "giraffe",
  "octopus",
  "kangaroo",
  "dolphin",
  "cheetah",
  "koala",
  "platypus",
  "pangolin",
];

export function getRandomUsername(str: string) {
  return `Anonymous ${animals[Math.abs(str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % animals.length]}`;
}
