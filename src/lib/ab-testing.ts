// A/B Testing and Feature Flags Utility

export interface Experiment {
  id: string;
  name: string;
  variants: string[];
  weights?: number[]; // Optional weights for each variant
  enabled: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  timestamp: Date;
}

class ABTestingManager {
  private static instance: ABTestingManager;
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment> = new Map();
  private storageKey = 'ab_testing_assignments';

  private constructor() {
    this.loadAssignments();
    this.initializeDefaultExperiments();
  }

  static getInstance(): ABTestingManager {
    if (!ABTestingManager.instance) {
      ABTestingManager.instance = new ABTestingManager();
    }
    return ABTestingManager.instance;
  }

  /**
   * Initialize default experiments
   */
  private initializeDefaultExperiments(): void {
    // Example experiments
    this.createExperiment({
      id: 'hero_slider_autoplay',
      name: 'Hero Slider Autoplay',
      variants: ['autoplay', 'manual'],
      weights: [0.5, 0.5],
      enabled: true,
    });

    this.createExperiment({
      id: 'movie_card_layout',
      name: 'Movie Card Layout',
      variants: ['grid', 'list', 'masonry'],
      weights: [0.5, 0.3, 0.2],
      enabled: true,
    });

    this.createExperiment({
      id: 'search_algorithm',
      name: 'Search Algorithm',
      variants: ['fuzzy', 'exact'],
      weights: [0.5, 0.5],
      enabled: false,
    });

    this.createExperiment({
      id: 'cta_button_color',
      name: 'CTA Button Color',
      variants: ['red', 'blue', 'green'],
      weights: [0.4, 0.4, 0.2],
      enabled: true,
    });
  }

  /**
   * Create a new experiment
   */
  createExperiment(experiment: Experiment): void {
    // Validate weights
    if (experiment.weights) {
      const sum = experiment.weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 0.001) {
        console.warn(`Experiment ${experiment.id} weights don't sum to 1. Normalizing...`);
        experiment.weights = experiment.weights.map(w => w / sum);
      }
    } else {
      // Equal weights
      const weight = 1 / experiment.variants.length;
      experiment.weights = experiment.variants.map(() => weight);
    }

    this.experiments.set(experiment.id, experiment);
  }

  /**
   * Get variant for a user (assigns if not already assigned)
   */
  getVariant(experimentId: string, userId?: string): string | null {
    const experiment = this.experiments.get(experimentId);

    if (!experiment || !experiment.enabled) {
      return null;
    }

    // Check if user already has an assignment
    const existingAssignment = this.assignments.get(experimentId);
    if (existingAssignment) {
      return existingAssignment.variant;
    }

    // Assign variant
    const variant = this.assignVariant(experiment, userId);

    // Store assignment
    this.assignments.set(experimentId, {
      experimentId,
      variant,
      timestamp: new Date(),
    });

    this.saveAssignments();

    return variant;
  }

  /**
   * Assign a variant based on weights
   */
  private assignVariant(experiment: Experiment, userId?: string): string {
    if (!experiment.weights) {
      return experiment.variants[0];
    }

    // Use userId for consistent assignment, or random
    const seed = userId ? this.hashString(userId) : Math.random();

    let cumulative = 0;
    for (let i = 0; i < experiment.variants.length; i++) {
      cumulative += experiment.weights[i];
      if (seed < cumulative) {
        return experiment.variants[i];
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  /**
   * Hash string to number between 0 and 1
   */
  public hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  }

  /**
   * Check if variant matches
   */
  isVariant(experimentId: string, variant: string, userId?: string): boolean {
    const assignedVariant = this.getVariant(experimentId, userId);
    return assignedVariant === variant;
  }

  /**
   * Enable/disable experiment
   */
  setExperimentEnabled(experimentId: string, enabled: boolean): void {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.enabled = enabled;
    }
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get all assignments
   */
  getAllAssignments(): ExperimentAssignment[] {
    return Array.from(this.assignments.values());
  }

  /**
   * Clear assignment for experiment
   */
  clearAssignment(experimentId: string): void {
    this.assignments.delete(experimentId);
    this.saveAssignments();
  }

  /**
   * Clear all assignments
   */
  clearAllAssignments(): void {
    this.assignments.clear();
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Load assignments from localStorage
   */
  private loadAssignments(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.assignments = new Map(
          data.map((item: ExperimentAssignment) => [
            item.experimentId,
            { ...item, timestamp: new Date(item.timestamp) },
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load A/B testing assignments:', error);
    }
  }

  /**
   * Save assignments to localStorage
   */
  private saveAssignments(): void {
    try {
      const data = Array.from(this.assignments.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save A/B testing assignments:', error);
    }
  }

  /**
   * Track experiment exposure (for analytics)
   */
  trackExperimentExposure(experimentId: string): void {
    const assignment = this.assignments.get(experimentId);
    if (assignment) {
      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'experiment_exposure', {
          experiment_id: experimentId,
          variant: assignment.variant,
        });
      }
    }
  }

  /**
   * Track experiment conversion
   */
  trackExperimentConversion(experimentId: string, conversionName: string, value?: number): void {
    const assignment = this.assignments.get(experimentId);
    if (assignment) {
      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'experiment_conversion', {
          experiment_id: experimentId,
          variant: assignment.variant,
          conversion_name: conversionName,
          value: value,
        });
      }
    }
  }

  /**
   * Get experiment report
   */
  getExperimentReport(experimentId: string) {
    const experiment = this.experiments.get(experimentId);
    const assignment = this.assignments.get(experimentId);

    return {
      experiment,
      assignment,
      isEnabled: experiment?.enabled ?? false,
      currentVariant: assignment?.variant ?? null,
      assignedAt: assignment?.timestamp ?? null,
    };
  }
}

// Export singleton instance
export const abTesting = ABTestingManager.getInstance();

// React hook for A/B testing
export function useABTest(experimentId: string, userId?: string) {
  const variant = abTesting.getVariant(experimentId, userId);

  return {
    variant,
    isVariant: (targetVariant: string) => variant === targetVariant,
    trackExposure: () => abTesting.trackExperimentExposure(experimentId),
    trackConversion: (name: string, value?: number) =>
      abTesting.trackExperimentConversion(experimentId, name, value),
  };
}

// Feature flag utility (simpler than experiments)
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
}

class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, FeatureFlag> = new Map();

  private constructor() {
    this.initializeDefaultFlags();
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  private initializeDefaultFlags(): void {
    this.createFlag({
      id: 'enable_reviews',
      name: 'Enable Reviews',
      enabled: true,
    });

    this.createFlag({
      id: 'enable_comments',
      name: 'Enable Comments',
      enabled: true,
    });

    this.createFlag({
      id: 'enable_social_sharing',
      name: 'Enable Social Sharing',
      enabled: true,
      rolloutPercentage: 50, // 50% rollout
    });

    this.createFlag({
      id: 'new_search_ui',
      name: 'New Search UI',
      enabled: false,
    });
  }

  createFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
  }

  isEnabled(flagId: string, userId?: string): boolean {
    const flag = this.flags.get(flagId);

    if (!flag || !flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const hash = userId ? abTesting.hashString(userId) : Math.random();
      return hash * 100 < flag.rolloutPercentage;
    }

    return true;
  }

  setEnabled(flagId: string, enabled: boolean): void {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = enabled;
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
}

export const featureFlags = FeatureFlagManager.getInstance();

export function useFeatureFlag(flagId: string, userId?: string): boolean {
  return featureFlags.isEnabled(flagId, userId);
}
