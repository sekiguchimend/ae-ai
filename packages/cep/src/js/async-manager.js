/**
 * Async Manager for CEP Panel
 * Handles non-blocking operations for AI, Supabase, and AE communications
 */

class AsyncManager {
  constructor() {
    this.pendingTasks = new Map();
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.isProcessing = false;
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute async task with retry logic
   */
  async executeWithRetry(taskFn, options = {}) {
    const {
      taskId = this.generateTaskId(),
      maxRetries = this.maxRetries,
      retryDelay = this.retryDelay,
      onProgress,
      onSuccess,
      onError,
    } = options;

    let attempts = 0;
    let lastError = null;

    this.pendingTasks.set(taskId, {
      status: 'pending',
      attempts: 0,
      startTime: Date.now(),
    });

    while (attempts < maxRetries) {
      attempts++;
      this.pendingTasks.set(taskId, {
        ...this.pendingTasks.get(taskId),
        status: 'running',
        attempts,
      });

      try {
        onProgress?.({ taskId, attempt: attempts, maxRetries });

        const result = await taskFn();

        this.pendingTasks.set(taskId, {
          ...this.pendingTasks.get(taskId),
          status: 'completed',
          result,
        });

        onSuccess?.(result);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Task ${taskId} attempt ${attempts} failed:`, error);

        if (attempts < maxRetries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempts - 1);
          await this.sleep(delay);
        }
      }
    }

    this.pendingTasks.set(taskId, {
      ...this.pendingTasks.get(taskId),
      status: 'failed',
      error: lastError,
    });

    onError?.(lastError);
    throw lastError;
  }

  /**
   * Queue task for background processing
   */
  queueTask(taskFn, options = {}) {
    const taskId = this.generateTaskId();

    this.retryQueue.push({
      id: taskId,
      fn: taskFn,
      options,
      addedAt: Date.now(),
    });

    this.processQueue();
    return taskId;
  }

  /**
   * Process queued tasks
   */
  async processQueue() {
    if (this.isProcessing || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.retryQueue.length > 0) {
      const task = this.retryQueue.shift();

      try {
        await this.executeWithRetry(task.fn, {
          taskId: task.id,
          ...task.options,
        });
      } catch (error) {
        console.error(`Queued task ${task.id} failed after retries:`, error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute AI API call asynchronously
   */
  async callAI(endpoint, payload, options = {}) {
    return this.executeWithRetry(
      async () => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        return response.json();
      },
      {
        ...options,
        maxRetries: options.maxRetries || 3,
      }
    );
  }

  /**
   * Execute Supabase operation asynchronously
   */
  async callSupabase(operation, options = {}) {
    return this.executeWithRetry(
      operation,
      {
        ...options,
        maxRetries: options.maxRetries || 2,
      }
    );
  }

  /**
   * Execute AE ExtendScript asynchronously
   */
  executeJSX(jsxCode, options = {}) {
    return new Promise((resolve, reject) => {
      const { timeout = 30000 } = options;
      let timeoutId;

      const callback = (result) => {
        clearTimeout(timeoutId);

        if (result === 'EvalScript error.') {
          reject(new Error('ExtendScript execution failed'));
        } else {
          try {
            const parsed = JSON.parse(result);
            resolve(parsed);
          } catch {
            resolve(result);
          }
        }
      };

      timeoutId = setTimeout(() => {
        reject(new Error('ExtendScript execution timeout'));
      }, timeout);

      try {
        if (typeof csInterface !== 'undefined') {
          csInterface.evalScript(jsxCode, callback);
        } else {
          clearTimeout(timeoutId);
          reject(new Error('CSInterface not available'));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Execute AE ExtendScript with retry
   */
  async executeJSXWithRetry(jsxCode, options = {}) {
    return this.executeWithRetry(
      () => this.executeJSX(jsxCode, options),
      {
        maxRetries: options.maxRetries || 2,
        retryDelay: options.retryDelay || 500,
        ...options,
      }
    );
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId) {
    return this.pendingTasks.get(taskId);
  }

  /**
   * Get all pending tasks
   */
  getPendingTasks() {
    return Array.from(this.pendingTasks.entries())
      .filter(([_, task]) => task.status === 'pending' || task.status === 'running')
      .map(([id, task]) => ({ id, ...task }));
  }

  /**
   * Cancel task
   */
  cancelTask(taskId) {
    const task = this.pendingTasks.get(taskId);
    if (task && (task.status === 'pending' || task.status === 'running')) {
      this.pendingTasks.set(taskId, {
        ...task,
        status: 'cancelled',
      });
      return true;
    }
    return false;
  }

  /**
   * Clear completed tasks
   */
  clearCompletedTasks() {
    for (const [id, task] of this.pendingTasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.pendingTasks.delete(id);
      }
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
const asyncManager = new AsyncManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AsyncManager, asyncManager };
}
