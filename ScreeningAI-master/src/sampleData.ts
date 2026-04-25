import { Job, Candidate } from "./types";

export const sampleJob: Job = {
  title: "Frontend Developer",
  requiredSkills: ["React", "Next.js", "TypeScript"],
  preferredSkills: ["Tailwind CSS", "Redux", "UI/UX"],
  minimumExperienceYears: 2,
  educationLevel: "Bachelor's Degree",
  description:
    "We are looking for a frontend developer with strong React and Next.js skills to build modern recruiter-facing interfaces."
};

export const sampleCandidates: Candidate[] = [
  {
    id: "c1",
    name: "Alice Uwase",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    experienceYears: 3,
    educationLevel: "Bachelor's Degree",
    summary:
      "Built responsive web apps using React and Next.js. Strong in UI implementation and API integration."
  },
  {
    id: "c2",
    name: "Brian Mugisha",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    experienceYears: 1,
    educationLevel: "Diploma",
    summary:
      "Junior frontend developer with React knowledge and interest in modern web development."
  },
  {
    id: "c3",
    name: "Claudine Iradukunda",
    skills: ["React", "Next.js", "TypeScript", "Redux", "Tailwind CSS"],
    experienceYears: 4,
    educationLevel: "Bachelor's Degree",
    summary:
      "Experienced frontend engineer with advanced state management and scalable UI architecture skills."
  }
];