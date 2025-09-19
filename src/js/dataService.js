// Data service for progressive loading
class DataService {
  constructor() {
    this.data = {
      projects: [],
      topics: [],
      tags: [],
      tagsMap: {}
    };
    this.loading = {
      projects: false,
      topics: false,
      tags: false
    };
    this.callbacks = {
      projects: [],
      topics: [],
      tags: []
    };
  }

  // Helper method to fetch data.json with multiple path attempts
  async fetchDataJson() {
    const paths = [
      '/data.json',
      './data.json', 
      'data.json',
      '/dist/data.json',
      './dist/data.json'
    ];
    
    for (const path of paths) {
      try {
        console.log(`Trying to fetch data from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          console.log(`Successfully fetched data from: ${path}`);
          return await response.json();
        }
      } catch (error) {
        console.log(`Failed to fetch from ${path}:`, error);
      }
    }
    
    throw new Error('Could not fetch data.json from any path');
  }

  // Load topics and tags first (lightweight data for filters)
  async loadFilterData() {
    if (this.loading.topics) return this.waitForData('topics');
    
    this.loading.topics = true;
    
    try {
      const fullData = await this.fetchDataJson();
      
      // Extract lightweight filter data
      this.data.topics = fullData.topics || [];
      this.data.tags = fullData.tags || [];
      this.data.tagsMap = fullData.tagsMap || {};
      
      this.loading.topics = false;
      this.notifyCallbacks('topics');
      
      return this.data;
    } catch (error) {
      console.error('Failed to load filter data:', error);
      this.loading.topics = false;
      throw error;
    }
  }

  // Load projects data (heavier data)
  async loadProjects() {
    if (this.loading.projects) return this.waitForData('projects');
    
    this.loading.projects = true;
    
    try {
      const fullData = await this.fetchDataJson();
      
      this.data.projects = fullData.projects || [];
      this.loading.projects = false;
      this.notifyCallbacks('projects');
      
      return this.data.projects;
    } catch (error) {
      console.error('Failed to load projects:', error);
      this.loading.projects = false;
      throw error;
    }
  }

  // Get cached data
  getTopics() {
    return this.data.topics;
  }

  getTags() {
    return this.data.tags;
  }

  getTagsMap() {
    return this.data.tagsMap;
  }

  getProjects() {
    return this.sortProjects([...this.data.projects]);
  }

  // Check if data is loaded
  isTopicsLoaded() {
    return this.data.topics.length > 0;
  }

  isProjectsLoaded() {
    return this.data.projects.length > 0;
  }

  // Subscribe to data loading events
  onTopicsLoaded(callback) {
    if (this.isTopicsLoaded()) {
      callback(this.data.topics);
    } else {
      this.callbacks.topics.push(callback);
    }
  }

  onProjectsLoaded(callback) {
    if (this.isProjectsLoaded()) {
      callback(this.data.projects);
    } else {
      this.callbacks.projects.push(callback);
    }
  }

  // Wait for specific data to load
  waitForData(type) {
    return new Promise((resolve) => {
      this.callbacks[type].push(resolve);
    });
  }

  // Notify callbacks when data is loaded
  notifyCallbacks(type) {
    this.callbacks[type].forEach(callback => {
      try {
        callback(this.data[type]);
      } catch (error) {
        console.error(`Error in callback for ${type}:`, error);
      }
    });
    this.callbacks[type] = [];
  }

  // Sort projects with published ones first, then by newest date
  sortProjects(projects) {
    return projects.sort((a, b) => {
      // First priority: published projects come first
      const aPublished = a.published === true ? 1 : 0;
      const bPublished = b.published === true ? 1 : 0;
      
      if (aPublished !== bPublished) {
        return bPublished - aPublished; // Published projects first
      }
      
      // Second priority: sort by date (newest first)
      const aDate = new Date(a.date || a.created_at || 0);
      const bDate = new Date(b.date || b.created_at || 0);
      
      return bDate - aDate; // Newest first
    });
  }

  // Filter projects by active filters
  filterProjects(activeFilters) {
    if (!this.isProjectsLoaded()) {
      return [];
    }

    const filteredProjects = this.data.projects.filter(project => {
      return activeFilters.every(filter => {
        const filterValue = filter.value.toLowerCase();
        
        // Check if project matches domain filter
        if (project.domains && project.domains.some(domain => 
          domain.toLowerCase().includes(filterValue)
        )) {
          return true;
        }
        
        // Check if project matches tag filter
        if (project.tags && project.tags.some(tag => 
          tag.toLowerCase().includes(filterValue)
        )) {
          return true;
        }
        
        // Check if project matches title or description
        if (project.project_title && project.project_title.toLowerCase().includes(filterValue)) {
          return true;
        }
        
        if (project.headline && project.headline.toLowerCase().includes(filterValue)) {
          return true;
        }
        
        return false;
      });
    });

    // Sort the filtered results
    return this.sortProjects(filteredProjects);
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;