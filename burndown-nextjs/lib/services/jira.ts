import { SprintList, Sprint } from "../types/sprint"
import { SprintIssues } from "../types/sprint-issues"

class JiraService {
  private baseUrl = process.env.JIRA_BASE_URL!
  private auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')

  private async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })
    return response.json()
  }

  // Board
  async getBoard(boardId: number): Promise<SprintList> {
    return this.request(`/rest/agile/1.0/board/${boardId}`)
  }

  async getSprintList(boardId: number): Promise<SprintList> {
    return this.request(`/rest/agile/1.0/board/${boardId}/sprint`)
  }

  // Sprint
  async getSprint(sprintId: number): Promise<Sprint> {
    return this.request(`/rest/agile/1.0/sprint/${sprintId}`)
  }

  async getSprintIssues(sprintId: number): Promise<SprintIssues> {
    return this.request(`/rest/agile/1.0/sprint/${sprintId}/issue?expand=changelog&maxResults=1000`)
  }
}

export const jiraService = new JiraService()