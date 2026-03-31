import { z } from 'zod';

// --- OpenEnv Models ---

export const ActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('list_tickets') }),
  z.object({ type: z.literal('view_ticket'), ticket_id: z.string() }),
  z.object({ type: z.literal('search_user'), query: z.string() }),
  z.object({ type: z.literal('search_order'), query: z.string() }),
  z.object({ type: z.literal('respond_to_ticket'), ticket_id: z.string(), message: z.string() }),
  z.object({ type: z.literal('close_ticket'), ticket_id: z.string(), resolution: z.string() }),
]);

export type Action = z.infer<typeof ActionSchema>;

export interface Observation {
  view: string;
  data: any;
  available_actions: string[];
}

export interface Reward {
  value: number;
  done: boolean;
  info: Record<string, any>;
}

// --- Environment State ---

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'closed';
  category?: string;
  resolution?: string;
  messages: { role: 'user' | 'agent'; content: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Order {
  id: string;
  user_id: string;
  product: string;
  status: 'shipped' | 'delivered' | 'pending' | 'cancelled';
  tracking_number?: string;
}

export interface EnvState {
  tickets: Ticket[];
  users: User[];
  orders: Order[];
  current_view: string;
  current_data: any;
  history: Action[];
  task_id: string;
}

// --- Tasks & Graders ---

export interface Task {
  id: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  initial_state: Partial<EnvState>;
  grader: (state: EnvState) => number;
}

export const TASKS: Task[] = [
  {
    id: 'task_1_easy',
    description: 'Categorize the ticket #T-101. The user is asking about a missing item in their order.',
    difficulty: 'easy',
    initial_state: {
      tickets: [
        {
          id: 'T-101',
          user_id: 'U-1',
          subject: 'Missing item',
          description: 'I received my order but the red shirt is missing.',
          status: 'open',
          messages: [{ role: 'user', content: 'I received my order but the red shirt is missing.' }],
        },
      ],
      users: [{ id: 'U-1', name: 'Alice', email: 'alice@example.com' }],
      orders: [{ id: 'O-1', user_id: 'U-1', product: 'Red Shirt, Blue Jeans', status: 'delivered' }],
    },
    grader: (state) => {
      const ticket = state.tickets.find(t => t.id === 'T-101');
      if (ticket?.status === 'closed' && ticket.resolution?.toLowerCase().includes('missing item')) {
        return 1.0;
      }
      return 0.0;
    },
  },
  {
    id: 'task_2_medium',
    description: 'Check the status of order #O-2 for user Bob (U-2) and inform him. He is worried it is lost.',
    difficulty: 'medium',
    initial_state: {
      tickets: [
        {
          id: 'T-102',
          user_id: 'U-2',
          subject: 'Where is my order?',
          description: 'My order #O-2 was supposed to arrive yesterday.',
          status: 'open',
          messages: [{ role: 'user', content: 'My order #O-2 was supposed to arrive yesterday.' }],
        },
      ],
      users: [{ id: 'U-2', name: 'Bob', email: 'bob@example.com' }],
      orders: [{ id: 'O-2', user_id: 'U-2', product: 'Laptop', status: 'shipped', tracking_number: 'TRK-999' }],
    },
    grader: (state) => {
      const ticket = state.tickets.find(t => t.id === 'T-102');
      const hasCorrectInfo = ticket?.messages.some(m => m.role === 'agent' && m.content.includes('TRK-999') && m.content.includes('shipped'));
      if (ticket?.status === 'closed' && hasCorrectInfo) {
        return 1.0;
      }
      if (hasCorrectInfo) return 0.5; // Partial progress
      return 0.0;
    },
  },
  {
    id: 'task_3_hard',
    description: 'Handle a refund request for order #O-3. User Charlie (U-3) wants a refund because the product is damaged. Check policy: refunds only allowed for "delivered" items within 30 days. Assume today is 2024-01-15. Order was delivered 2024-01-10.',
    difficulty: 'hard',
    initial_state: {
      tickets: [
        {
          id: 'T-103',
          user_id: 'U-3',
          subject: 'Damaged product refund',
          description: 'The headphones I received are broken. I want a refund.',
          status: 'open',
          messages: [{ role: 'user', content: 'The headphones I received are broken. I want a refund.' }],
        },
      ],
      users: [{ id: 'U-3', name: 'Charlie', email: 'charlie@example.com' }],
      orders: [{ id: 'O-3', user_id: 'U-3', product: 'Headphones', status: 'delivered' }],
    },
    grader: (state) => {
      const ticket = state.tickets.find(t => t.id === 'T-103');
      const approved = ticket?.messages.some(m => m.role === 'agent' && m.content.toLowerCase().includes('refund approved'));
      if (ticket?.status === 'closed' && approved) {
        return 1.0;
      }
      if (approved) return 0.7; // Partial progress
      const checkedOrder = state.history.some(a => a.type === 'search_order' && a.query.includes('O-3'));
      if (checkedOrder) return 0.3;
      return 0.0;
    },
  },
];

// --- Environment Implementation ---

export class CustomerSupportEnv {
  private state_data: EnvState;

  constructor(taskId: string = 'task_1_easy') {
    this.state_data = this.getInitialState(taskId);
  }

  private getInitialState(taskId: string): EnvState {
    const task = TASKS.find(t => t.id === taskId) || TASKS[0];
    return {
      tickets: task.initial_state.tickets || [],
      users: task.initial_state.users || [],
      orders: task.initial_state.orders || [],
      current_view: 'dashboard',
      current_data: null,
      history: [],
      task_id: taskId,
    };
  }

  public reset(taskId?: string): Observation {
    if (taskId) {
      this.state_data = this.getInitialState(taskId);
    } else {
      this.state_data = this.getInitialState(this.state_data.task_id);
    }
    return this.getObservation();
  }

  public state(): EnvState {
    return this.state_data;
  }

  public step(action: Action): [Observation, Reward] {
    this.state_data.history.push(action);

    switch (action.type) {
      case 'list_tickets':
        this.state_data.current_view = 'tickets_list';
        this.state_data.current_data = this.state_data.tickets.map(t => ({ id: t.id, subject: t.subject, status: t.status }));
        break;

      case 'view_ticket':
        const ticket = this.state_data.tickets.find(t => t.id === action.ticket_id);
        if (ticket) {
          this.state_data.current_view = 'ticket_detail';
          this.state_data.current_data = ticket;
        } else {
          this.state_data.current_view = 'error';
          this.state_data.current_data = { error: 'Ticket not found' };
        }
        break;

      case 'search_user':
        const user = this.state_data.users.find(u => u.id === action.query || u.email === action.query || u.name.includes(action.query));
        this.state_data.current_view = 'user_search_results';
        this.state_data.current_data = user ? [user] : [];
        break;

      case 'search_order':
        const order = this.state_data.orders.find(o => o.id === action.query || o.user_id === action.query);
        this.state_data.current_view = 'order_search_results';
        this.state_data.current_data = order ? [order] : [];
        break;

      case 'respond_to_ticket':
        const tToRespond = this.state_data.tickets.find(t => t.id === action.ticket_id);
        if (tToRespond) {
          tToRespond.messages.push({ role: 'agent', content: action.message });
          this.state_data.current_view = 'ticket_detail';
          this.state_data.current_data = tToRespond;
        }
        break;

      case 'close_ticket':
        const tToClose = this.state_data.tickets.find(t => t.id === action.ticket_id);
        if (tToClose) {
          tToClose.status = 'closed';
          tToClose.resolution = action.resolution;
          this.state_data.current_view = 'ticket_detail';
          this.state_data.current_data = tToClose;
        }
        break;
    }

    const obs = this.getObservation();
    const task = TASKS.find(t => t.id === this.state_data.task_id)!;
    const score = task.grader(this.state_data);
    const done = score === 1.0 || this.state_data.history.length >= 10;

    return [obs, { value: score, done, info: { history_length: this.state_data.history.length } }];
  }

  private getObservation(): Observation {
    return {
      view: this.state_data.current_view,
      data: this.state_data.current_data,
      available_actions: [
        'list_tickets',
        'view_ticket',
        'search_user',
        'search_order',
        'respond_to_ticket',
        'close_ticket',
      ],
    };
  }
}
