# **App Name**: TreeView

## Core Features:

- Tree Display: Displays an org chart based on the selected tree, visualizing the hierarchy of bigs and littles.
- Tree Selection: A dropdown menu to switch between available trees.
- New Connection Input: Input fields for bit, byte, tree name, and year of pickup to facilitate adding new connections to the tree.
- Connection Submission: Form submission to commit the connection to the Cloud SQL database. If tree name is empty, default to the byte's tree.
- Suggested Connection Names: Suggest names for big and little using a generative AI tool that considers existing relationships to find possible connections

## Style Guidelines:

- Primary color: Soft blue (#A0BFE0) to evoke a sense of calmness and clarity, fitting for visualizing organizational structures.
- Background color: Very light blue (#F0F8FF), near-white to ensure readability and minimize distractions.
- Accent color: Light purple (#BBA0E0), providing visual interest without overwhelming the primary focus on the org chart.
- Body and headline font: 'Inter', a grotesque-style sans-serif for its modern and neutral appearance.
- Use minimalist, geometric icons to represent individuals or teams within the org chart.
- Employ a clean and structured layout to display the org chart, ensuring clear hierarchy and easy navigation.
- Subtle transitions and animations to enhance user interaction and provide feedback when navigating the tree.