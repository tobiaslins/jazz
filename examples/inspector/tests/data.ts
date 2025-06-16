import { ImageDefinition, co, z } from "jazz-tools";

const projectsData: {
  name: string;
  description: string;
  issues: {
    title: string;
    status: "open" | "closed";
    labels: string[];
    reactions?: ReactionType[];
  }[];
}[] = [
  {
    name: "Jazz",
    description: "Jazz is a framework for building collaborative apps.",
    issues: [
      {
        title: "Issue 1",
        status: "open",
        labels: [
          "bug",
          "feature",
          "enhancement",
          "documentation",
          "homepage",
          "help needed",
          "requested",
          "blocked",
          "high priority",
          "urgent",
        ],
        reactions: ["thumb-up"],
      },
      { title: "Issue 2", status: "closed", labels: ["bug"] },
      { title: "Issue 3", status: "open", labels: ["feature", "enhancement"] },
    ],
  },
  {
    name: "Waffle",
    description: "Start waffling",
    issues: [],
  },
  {
    name: "Garden",
    description: "Grow your garden",
    issues: [],
  },
  {
    name: "Tilescape",
    description: "",
    issues: [],
  },
];

const ReactionTypes = ["thumb-up", "thumb-down"] as const;

type ReactionType = (typeof ReactionTypes)[number];

const ReactionsList = co.feed(z.literal([...ReactionTypes]));

export const Issue = co.map({
  title: z.string(),
  status: z.enum(["open", "closed"]),
  labels: co.list(z.string()),
  reactions: ReactionsList,
});

const Project = co.map({
  name: z.string(),
  description: z.string(),
  issues: co.list(Issue),
});

const Organization = co.map({
  name: z.string(),
  projects: co.list(Project),
  image: co.image(),
});

export const createOrganization = () => {
  return Organization.create({
    name: "Garden Computing",
    image: ImageDefinition.create({
      originalSize: [1920, 1080],
      placeholderDataURL: "data:image/jpeg;base64,...",
    }),
    projects: co.list(Project).create(
      projectsData.map((project) =>
        Project.create({
          name: project.name,
          description: project.description,
          issues: co.list(Issue).create(
            project.issues.map((issue) =>
              Issue.create({
                title: issue.title,
                status: issue.status,
                labels: co.list(z.string()).create(issue.labels),
                reactions: ReactionsList.create(issue.reactions || []),
              }),
            ),
          ),
        }),
      ),
    ),
  });
};
