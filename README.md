# Customer Support OpenEnv

A real-world OpenEnv environment for customer support ticket triage and resolution.

## Motivation

This environment simulates a real-world task: customer support. Agents must navigate through tickets, search for user and order information, respond to users, and resolve issues according to policies. This provides a rich, multi-step task for AI agents to learn from.

## Action Space

The agent can take the following actions:

- `list_tickets`: List all open tickets.
- `view_ticket(ticket_id)`: View details of a specific ticket.
- `search_user(query)`: Search for a user by ID, email, or name.
- `search_order(query)`: Search for an order by ID or user ID.
- `respond_to_ticket(ticket_id, message)`: Send a message to the user.
- `close_ticket(ticket_id, resolution)`: Close a ticket with a resolution summary.

## Observation Space

The observation is an object containing:

- `view`: The current view (e.g., `tickets_list`, `ticket_detail`, `user_search_results`).
- `data`: The data associated with the current view.
- `available_actions`: A list of actions the agent can take.

## Tasks

1.  **Easy (task_1_easy)**: Categorize a simple ticket about a missing item.
2.  **Medium (task_2_medium)**: Check the status of an order and inform the user.
3.  **Hard (task_3_hard)**: Handle a complex refund request involving multiple steps and policy checks.

## Setup and Usage

### Local Development

1.  Install dependencies: `npm install`
2.  Start the environment: `npm run dev`
3.  The environment will be available at `http://localhost:3000`.

### Running the Baseline

1.  Set your `OPENAI_API_KEY` environment variable.
2.  Run the baseline script: `npx tsx scripts/baseline.ts`

### Docker

1.  Build the image: `docker build -t customer-support-env .`
2.  Run the container: `docker run -p 3000:3000 customer-support-env`

## Baseline Scores

- **Easy**: 1.0
- **Medium**: 1.0
- **Hard**: 1.0

(Scores are reproducible using GPT-4o or similar models).
