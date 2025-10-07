!function(t,e){const n=document.createElement("script");n.type="text/javascript",n.async=!0,n.onload=function(){},n.src="https://templates.drieam.com/templates/production/crean-lutheran/script.js",t.getElementsByTagName("head")[0].appendChild(n)}(document);










(function() {
  var targetCourseId = '5526'; // Your course ID; set to null for all courses

  var path = location.pathname;
  if ((targetCourseId === null && /\/courses\/\d+\/assignments$/.test(path)) ||
      (targetCourseId !== null && path === `/courses/${targetCourseId}/assignments`)) {

    // Function to insert menu when toolbar is ready
    function insertFilterMenu() {
      var toolbar = document.querySelector('#content .header-bar');
      if (toolbar) {
        // Create filter menu div
        var filterMenu = document.createElement('div');
        filterMenu.id = 'custom-filter-menu';
        filterMenu.style.marginBottom = '20px';

        // Create published toggle button
        var publishedToggle = document.createElement('button');
        publishedToggle.textContent = 'Show Only Published';
        publishedToggle.style.marginRight = '10px';
        filterMenu.appendChild(publishedToggle);

        // Create sort dropdown
        var sortSelect = document.createElement('select');
        var options = ['Default', 'Due Date (Oldest First)', 'Title (A-Z)'];
        options.forEach(function(opt) {
          var option = document.createElement('option');
          option.value = opt.toLowerCase().replace(/ /g, '-');
          option.textContent = opt;
          sortSelect.appendChild(option);
        });
        sortSelect.style.marginRight = '10px';
        filterMenu.appendChild(sortSelect);

        // Create 0% groups toggle button
        var zeroPercentToggle = document.createElement('button');
        zeroPercentToggle.textContent = 'Show Graded/Submitted in 0% Groups Only';
        filterMenu.appendChild(zeroPercentToggle);

        // Insert after toolbar
        toolbar.after(filterMenu);

        // Toggle states (no persistence)
        var showingAll = true;
        var sortType = 'default';
        var showingZeroPercentOnly = true; // Default on for this toggle? Adjust if needed

        publishedToggle.addEventListener('click', function() {
          showingAll = !showingAll;
          this.textContent = showingAll ? 'Show Only Published' : 'Show All';
          applyFilters();
        });

        sortSelect.addEventListener('change', function() {
          sortType = this.value;
          applyFilters();
        });

        zeroPercentToggle.addEventListener('click', function() {
          showingZeroPercentOnly = !showingZeroPercentOnly;
          this.textContent = showingZeroPercentOnly ? 'Show All Groups' : 'Show Graded/Submitted in 0% Groups Only';
          applyFilters();
        });

        // Set up observer for assignment lists to apply filters when ready
        var agList = document.querySelector('#ag-list');
        if (agList) {
          var listObserver = new MutationObserver(function() {
            applyFilters();
            listObserver.disconnect(); // Stop after first apply
          });
          listObserver.observe(agList, { childList: true, subtree: true });
        } else {
          console.log('ag-list not found for observer.');
        }

        // Initial apply in case already loaded
        applyFilters();

        function applyFilters() {
          applyPublishedToggle(showingAll);
          if (!showingZeroPercentOnly) {
            applyZeroPercentFilter();
          } else {
            // Reset for 'Show All Groups'
            document.querySelectorAll('.item-group-condensed').forEach(function(group) {
              group.style.display = '';
              group.querySelectorAll('.ig-row').forEach(function(item) {
                item.style.display = '';
              });
            });
          }
          applySort(sortType);
        }

        function applyPublishedToggle(showAll) {
          var unpublishedItems = document.querySelectorAll('.ig-list .ig-row .publish-icon-publish');
          unpublishedItems.forEach(function(icon) {
            var item = icon.closest('.ig-row');
            if (item) {
              item.style.display = showAll ? '' : 'none';
            }
          });
        }

        function applyZeroPercentFilter() {
          var groups = document.querySelectorAll('.item-group-condensed');
          groups.forEach(function(group) {
            var pill = group.querySelector('.pill li');
            if (pill && pill.textContent.trim() !== '0% of Total') {
              group.style.display = 'none';
              return;
            }
            // For 0% groups, hide assignments without grades/submissions
            var items = group.querySelectorAll('.ig-row');
            items.forEach(function(item) {
              var speedGrader = item.querySelector('.speed-grader-link-container');
              if (speedGrader && speedGrader.classList.contains('hidden')) {
                item.style.display = 'none';
              }
            });
            // Hide group if no visible items left
            if (group.querySelectorAll('.ig-row:not([style*="display: none"])').length === 0) {
              group.style.display = 'none';
            }
          });
        }

        function applySort(type) {
          var groups = document.querySelectorAll('.item-group-condensed');
          groups.forEach(function(group) {
            if (group.style.display === 'none') return; // Skip hidden groups
            var list = group.querySelector('.assignment-list ul');
            if (!list) return;
            var items = Array.from(list.querySelectorAll('.ig-row:not([style*="display: none"])')); // Visible only

            if (type === 'due-date-(oldest-first)') {
              items.sort(function(a, b) {
                var dateA = parseDueDate(getDueDate(a));
                var dateB = parseDueDate(getDueDate(b));
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1; // No date last
                if (!dateB) return -1;
                return dateA - dateB;
              });
            } else if (type === 'title-(a-z)') {
              items.sort(function(a, b) {
                var titleA = a.querySelector('.ig-title').textContent.trim().toLowerCase();
                var titleB = b.querySelector('.ig-title').textContent.trim().toLowerCase();
                return titleA.localeCompare(titleB);
              });
            } // 'default' does nothing

            // Re-append in sorted order
            items.forEach(function(item) {
              list.appendChild(item);
            });
          });
        }

        // Helper to get due date string
        function getDueDate(item) {
          var dueElem = item.querySelector('.assignment-date-due span[data-html-tooltip-title]');
          return dueElem ? dueElem.getAttribute('data-html-tooltip-title') : null;
        }

        // Improved date parser (handles "Month Day at Time" or "Month Day, Year at Time")
        function parseDueDate(dateStr) {
          if (!dateStr) return null;
          // Assume current year if not specified
          var year = new Date().getFullYear();
          if (dateStr.match(/\d{4}/)) year = dateStr.match(/\d{4}/)[0]; // Extract year if present
          var months = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
          var parts = dateStr.match(/(\w+) (\d+)(?:, (\d+))? at (\d+):?(\d+)?(\w+)?/);
          if (!parts) return null;
          var month = months[parts[1]];
          var day = parseInt(parts[2]);
          var hour = parseInt(parts[4]);
          var min = parts[5] ? parseInt(parts[5]) : 0;
          var ampm = parts[6];
          if (ampm && ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
          if (ampm && ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
          return new Date(year, month, day, hour, min).getTime();
        }

        console.log('Menu inserted successfully.');
        return true; // Success
      }
      return false; // Not ready yet
    }

    // Try inserting immediately
    if (!insertFilterMenu()) {
      // If not ready, observe DOM changes
      var observer = new MutationObserver(function(mutations) {
        if (insertFilterMenu()) {
          observer.disconnect(); // Stop observing once inserted
        }
      });
      var content = document.querySelector('#content');
      if (content) {
        observer.observe(content, { childList: true, subtree: true });
      } else {
        console.log('Content container not found for observer.');
      }
    }
  }
})();














// ==UserScript==
// @name         Canvas - Teacher's 'Coming Up' List (v3)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Replaces the teacher's "Coming Up" list on the course home page with a corrected list of published, assigned assignments due in the next 2 weeks.
// @author       Grok
// @match        https://*.instructure.com/courses/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const DAYS_TO_SHOW = 21; // Set the number of days into the future to show assignments.
    const NEW_LIST_TITLE = 'Coming Up'; // The title for the new list, matching the screenshot.
    // ---------------------

    // Only run on the course home page
    if (!/^\/courses\/\d+$/.test(window.location.pathname)) {
        return;
    }

    // Check if ENV is available
    if (!window.ENV || !window.ENV.current_user_roles) {
        return;
    }

    // Check if user is observer or student
    function isObserverOrStudent() {
        return window.ENV.current_user_roles.includes('student') || window.ENV.current_user_roles.includes('observer');
    }

    if (isObserverOrStudent()) {
        return;
    }

    // Function to format dates in a user-friendly way
    function formatDate(dateString) {
        if (!dateString) return 'Multiple Due Dates';
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    // Function to get icon class based on assignment type
    function getIconClass(asn) {
        if (asn.quiz_id) return 'icon-quiz';
        if (asn.discussion_topic_id) return 'icon-discussion';
        if (asn.submission_types && asn.submission_types.includes('external_tool')) return 'icon-lti';
        return 'icon-assignment';
    }

    // Function to get all due dates for filtering
    function getDueDates(asn) {
        let dueDates = [];
        if (asn.due_at) {
            dueDates.push(new Date(asn.due_at));
        }
        if (asn.all_dates) {
            asn.all_dates.forEach(ad => {
                if (ad.due_at) {
                    dueDates.push(new Date(ad.due_at));
                }
            });
        }
        return dueDates;
    }

    // Main function to fetch data and build the list
    async function createCustomComingUpList() {
        try {
            const rightSide = document.getElementById('right-side') || document.querySelector('.right-side');
            if (!rightSide) return;

            const comingUpHeading = Array.from(rightSide.querySelectorAll('h2, .h2')).find(
                h => h.textContent.trim().includes('Coming Up') || h.textContent.trim().includes('To Do')
            );

            const originalListContainer = comingUpHeading ? comingUpHeading.parentElement : null;
            if (!originalListContainer) {
                return;
            }

            const courseId = window.location.pathname.match(/\/courses\/(\d+)/)[1];
            if (!courseId) return;

            // Fetch course details for short name
            const courseResponse = await fetch(`/api/v1/courses/${courseId}`);
            if (!courseResponse.ok) throw new Error(`Course API request failed: ${courseResponse.status}`);
            const course = await courseResponse.json();
            const courseShort = course.course_code || course.name;

            // Fetch all assignments with overrides and all_dates
            let apiUrl = `/api/v1/courses/${courseId}/assignments?per_page=100&order_by=due_at&include[]=overrides&include[]=all_dates`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`Assignments API request failed: ${response.status}`);
            const assignments = await response.json();

            // Date range for filtering
            const now = new Date();
            const limitDate = new Date();
            limitDate.setDate(now.getDate() + DAYS_TO_SHOW);

            const filteredAssignments = assignments.filter(asn => {
                // Condition 1: Must be published.
                const isPublished = asn.published;

                // Condition 2: Must have at least one due date in the date range.
                const dueDates = getDueDates(asn);
                const isInDateRange = dueDates.some(d => d >= now && d <= limitDate);

                // Condition 3: Must be assigned to someone (not 'Assign to: Nobody').
                const isAssigned = !asn.only_visible_to_overrides || (asn.overrides && asn.overrides.length > 0);

                return isPublished && isInDateRange && isAssigned;
            });

            originalListContainer.innerHTML = `
                <h2>${NEW_LIST_TITLE}
                    <span style="display: inline-block; background-color: #eee; border-radius: 50%; padding: 0 6px; font-size: 0.8em; margin-left: 5px;">${filteredAssignments.length}</span>
                    <a href="/calendar" style="float: right; font-size: 0.8em; text-decoration: none; color: #00599c;">View Calendar</a>
                </h2>
                <div id="custom-coming-up-list"><p>Loading assignments...</p></div>`;

            const customListDiv = document.getElementById('custom-coming-up-list');

            if (filteredAssignments.length > 0) {
                let listItems = '';
                filteredAssignments.forEach(asn => {
                    const dueText = formatDate(asn.due_at);
                    listItems += `
                        <li style="margin-bottom: 10px; list-style: none;">
                            <div style="display: flex; align-items: flex-start;">
                                <i class="${getIconClass(asn)}" style="margin-right: 10px; font-size: 1.5em; color: #777;" aria-hidden="true"></i>
                                <div style="flex: 1;">
                                    <a href="${asn.html_url}" style="text-decoration: none;">
                                        <div style="color: #00599c;">${asn.name}</div>
                                        <div style="font-size: 0.9em; color: #666;">${courseShort}</div>
                                        <div style="font-size: 0.9em; color: #666;">
                                            ${asn.points_possible} points • ${dueText}
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </li>`;
                });
                customListDiv.innerHTML = `<ul style="list-style: none; padding: 0; margin: 0;">${listItems}</ul>`;
            } else {
                customListDiv.innerHTML = `<p>No published assignments due in the next ${DAYS_TO_SHOW} days.</p>`;
            }

        } catch (error) {
            console.error('Error creating custom "Coming Up" list:', error);
            const customListDiv = document.getElementById('custom-coming-up-list');
            if (customListDiv) {
                customListDiv.innerHTML = '<p>Could not load assignments.</p>';
            }
        }
    }

    const observer = new MutationObserver((mutationsList, obs) => {
        if (document.getElementById('right-side') || document.querySelector('.right-side')) {
            createCustomComingUpList();
            obs.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();