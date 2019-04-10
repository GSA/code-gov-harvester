class StatusFormatter {
    constructor({report, allPreviousCounts}) {
        this.report = report;
        this.allPreviousCounts = allPreviousCounts;
    }

    _convertToHTMLTRs({agencies, caption = "", type = ""}) {
        if (agencies.length > 0) {
            agencies.sort((a, b) => {
                let acronymA = a.acronym.toLowerCase(),
                    acronymB = b.acronym.toLowerCase();
                return (acronymA < acronymB) ? -1 : (acronymA > acronymB) ? 1 : 0;
            });
            let bgColor = type.toLowerCase() === "error" ? "#F5A9A9" :
                type.toLowerCase() === "warning" ? "#F2F5A9" :
                type.toLowerCase() === "duplicates" ? "#A9E2F3" :
                "#FFFFFF";

            let html = "";
            if (caption) {
                html = `<tr style="background-color: ${bgColor}; font-weight: bold">
                    <td colspan="6">${caption}</td>
                    </tr>`;
            }

            agencies.forEach(agency => {
                let counts = [];
                let diffCounts = false;
                Object.keys(agency.counts).forEach(usageType => {
                    let countsText = `${usageType}: `;
                    const previousUsageTypeCount = agency.previousCounts[usageType] ? agency.previousCounts[usageType] : 0;
                    if (agency.counts[usageType] === previousUsageTypeCount) {
                        countsText += `<em>${agency.counts[usageType]}</em>`;
                    } else {
                        countsText += `<em>${agency.counts[usageType]} (${previousUsageTypeCount})</em>`;
                        diffCounts = true;
                    }
                    counts.push(countsText);
                });
                html += `<tr style="background-color: ${bgColor}">
                    <td>${agency.acronym}</td>
                    <td>${(agency.wasRemoteJsonRetrived ? "Yes" : "No")}</td>
                    <td>${(agency.wasRemoteJsonParsed ? "Yes" : "No")}</td>
                    <td>${(agency.wasFallbackUsed ? "Yes" : "No")}</td>
                    <td>${counts.join(" | ")}</td>
                    <td>${diffCounts ? "Yes" : ""}</td>
                    </tr>`;
            });
            return html;
        }
        return "";
    }

    getFormattedStatus() {
        let agencies = [];
        const {
            timestamp,
            statuses
        } = this.report;
        Object.keys(statuses).forEach(acronym => {
            const {
                wasFallbackUsed,
                wasRemoteJsonRetrived,
                wasRemoteJsonParsed,
                counts
            } = statuses[acronym];
            const previousCounts = this.allPreviousCounts[acronym] ? this.allPreviousCounts[acronym] : {};
            agencies.push({
                acronym,
                wasFallbackUsed,
                wasRemoteJsonRetrived,
                wasRemoteJsonParsed,
                counts,
                previousCounts
            });
        });
        let html = `<h3>CODE.GOV Repository Harvester Execution Summary</h3>
          <h4>Time: ${timestamp}</h4>
          <table border="1" cellspacing="0" cellpadding="2">
            <tr style="background-color: #E6E6E6">
            <th>Agency<br />Acronym</th>
            <th>Retrieved Remote<br />code.json</th>
            <th>Parsed Remote<br />code.json</th>
            <th>Fallback<br />Used</th>
            <th>Repository Counts</th> 
            <th>Changed</th>
            </tr>`;
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.wasRemoteJsonRetrived && !agency.wasFallbackUsed),
            caption: "No remote code.json file.  Missing fallback file or errors while processing fallback file.",
            type: "error"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && !agency.wasRemoteJsonParsed && !agency.wasFallbackUsed),
            caption: "Errors while processing remote code.json file.  Missing fallback file or errors while processing fallback file.",
            type: "error"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.wasRemoteJsonRetrived && agency.wasFallbackUsed),
            caption: "No remote code.json file.  Used fallback file successfully.",
            type: "warning"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && !agency.wasRemoteJsonParsed && agency.wasFallbackUsed),
            caption: "Errors while processing Remote code.json file.  Used fallback file successfully.",
            type: "warning"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && agency.wasRemoteJsonParsed && agency.counts.duplicates),
            caption: "Used remote code.json successfully - with duplicates.",
            type: "duplicates"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && agency.wasRemoteJsonParsed && !agency.counts.duplicates),
            caption: "Used remote code.json successfully."
        });
        html += `</table>`;
        return html
    }
}

module.exports = StatusFormatter;