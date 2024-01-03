# Function to paginate through API results
        # needed in case the count of any of the items gets too large to handle github's default
        # for number of items per page of results
        function paginate() {
          url=$1
          all_data=""
          while [ "$url" != "null" ]; do
            response=$(curl -H "Authorization: token $GITHUB_TOKEN" -s -I "$url")
            all_data+=$(curl -H "Authorization: token $GITHUB_TOKEN" -s "$url")
            url=$(echo "$response" | grep -oP '(?<=<)(.*?)(?=>; rel="next")')
          done
          echo "$all_data"
        }

        # Get the first day of the current month
        month_start=$(date -u +"%Y-%m-01T00:00:00Z")

        # Pagination for opened issues
        opened_issues_data=$(paginate "https://api.github.com/repos/${{ github.repository }}/issues?state=open&since=$month_start")
        opened_issues_count=$(echo "$opened_issues_data" | jq '[.[] | select(.author_association != "MEMBER") and select(.author_association != "OWNER") and (.pull_request == null)] | length')

        # Pagination for opened PRs
        opened_prs_data=$(paginate "https://api.github.com/repos/${{ github.repository }}/pulls?state=open&since=$month_start")
        opened_prs_count=$(echo "$opened_prs_data" | jq '[.[] | select(.author_association != "MEMBER") and select(.author_association != "OWNER")] | length')

        # Pagination for closed issues
        closed_issues_data=$(paginate "https://api.github.com/repos/${{ github.repository }}/issues?state=closed")
        closed_issues_count=$(echo "$closed_issues_data" | jq '[.[] | select(.closed_at >= "'$month_start'") and select(.author_association != "MEMBER") and select(.author_association != "OWNER") and (.pull_request == null)] | length')

        # Pagination for closed PRs
        closed_prs_data=$(paginate "https://api.github.com/repos/${{ github.repository }}/pulls?state=closed")
        closed_prs_count=$(echo "$closed_prs_data" | jq '[.[] | select(.closed_at >= "'$month_start'") and select(.author_association != "MEMBER") and select(.author_association != "OWNER")] | length')

        echo "Number of issues opened by non-members this month: $opened_issues_count"
        echo "Number of PRs opened by non-members this month: $opened_prs_count"
        echo "Number of issues closed by non-members this month: $closed_issues_count"
        echo "Number of PRs closed by non-members this month: $closed_prs_count"