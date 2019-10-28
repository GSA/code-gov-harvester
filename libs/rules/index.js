const { Utils } = require('../utils');

const nameRule = {
  validation: function (target) {
    return target['name'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('name'));
    return target;
  }
};
const versionRule = {
  validation: function (target) {
    return target['version'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('version'));
    return target;
  }
};
const organizationRule = {
  validation: function (target) {
    return target['organization'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('organization'));
    return target;
  }
};
const descriptionRule = {
  validation: function (target) {
    return target['description'] && target['description'] !== target['name'];
  },
  outcome: function (target) {
    const description = target['description'].split(' ');

    let multiplier = 0.0;
    if (description.length >= 30) {
      multiplier = 1.0;
    } else if (description.length < 30 && description.length >= 20) {
      multiplier = 0.8;
    } else if (description.length < 20 && description.length >= 10) {
      multiplier = 0.5;
    } else if (description.length < 10 && description.length >= 4) {
      multiplier = 0.3;
    }
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + (Utils.getFieldWeight('description') * multiplier));

    return target;
  }
};
const licenseUrlRule = {
  validation: function (target) {
    if (target['permissions.licenses.0.URL']) {
      return Utils.isValidUrl(target['permissions.licenses.0.URL']);
    }
    return false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('permissions.licenses.URL'));
    return target;
  }
};
const licenseNameRule = {
  validation: function (target) {
    return target['permissions.licenses.0.name'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('permissions.licenses.name'));
    return target;
  }
};
const usageTypeRule = {
  validation: function (target) {
    return target['permissions.usageType'] ? true : false;
  },
  outcome: function (target) {
    const usageType = target['permissions.usageType'];

    let multiplier = 0.0;
    if (usageType.toLowerCase() === 'opensource') {
      multiplier = 1.0;
    } else if (usageType.toLowerCase() === 'governmentwidereuse') {
      multiplier = 0.5;
    } else if (usageType.match(/^exempt.*/g)) {
      multiplier = 0.1;
    }
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + (Utils.getFieldWeight('permissions.usageType') * multiplier));

    return target;
  }
};
const exemptionTextRule = {
  validation: function (target) {
    return target['permissions.usageType'] ? true : false;
  },
  outcome: function (target) {
    const usageType = target['permissions.usageType'];

    let multiplier = 0.0;
    if (usageType.toLowerCase() === 'opensource' || usageType.toLowerCase() === 'governmentwidereuse') {
      multiplier = 1.0;
    } else if (usageType.match(/^exempt.*/g) && target['permissions.exemptionText']) {
      multiplier = 1.0;
    }
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + (Utils.getFieldWeight('permissions.exemptionText') * multiplier));

    return target;
  }
};
const tagsRules = {
  validation: function (target) {
    return target['tags'] ? true : false;
  },
  outcome: function (target) {
    const tags = target['tags'];

    let multiplier = 0.0;
    if (tags.length >= 3) {
      multiplier = 1.0;
    } else if (tags.length === 2) {
      multiplier = 0.6;
    } else if (tags.length === 1) {
      multiplier = 0.4;
    }
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + (Utils.getFieldWeight('tags') * multiplier));

    return target;
  }
};
const contactEmailRule = {
  validation: function (target) {
    return target['contact.email'] && Utils.isValidEmail(target['contact.email']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('contact.email'));
    return target;
  }
};
const contactNameRule = {
  validation: function (target) {
    return target['contact.name'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('contact.name'));
    return target;
  }
};
const contactUrlRule = {
  validation: function (target) {
    return target['contact.URL'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('contact.URL'));
    return target;
  }
};
const contactPhoneRule = {
  validation: function (target) {
    return target['contact.phone'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('contact.phone'));
    return target;
  }
};
const statusRule = {
  validation: function (target) {
    return target['status'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('status'));
    return target;
  }
};
const vcsRule = {
  validation: function (target) {
    return target['vcs'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('vcs'));
    return target;
  }
};
const repositoryURLRule = {
  validation: function (target) {
    // not only should there be a value but also a proper URL
    return target['repositoryURL'] && Utils.isValidUrl(target['repositoryURL']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('repositoryURL'));
    return target;
  }
};
const homepageURLRule = {
  validation: function (target) {
    return target['homepageURL'] && Utils.isValidUrl(target['homepageURL']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('homepageURL'));
    return target;
  }
};
const downloadURLRule = {
  validation: function (target) {
    return target['downloadURL'] && Utils.isValidUrl(target['downloadURL']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('downloadURL'));
    return target;
  }
};
const disclaimerURLRule = {
  validation: function (target) {
    return target['disclaimerURL'] && Utils.isValidUrl(target['disclaimerURL']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('disclaimerURL'));
    return target;
  }
};
const disclaimerTextRule = {
  validation: function (target) {
    return target['disclaimerText'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('disclaimerText'));
    return target;
  }
};
const languagesRule = {
  validation: function (target) {
    return target['languages'] ? true : false;
  },
  outcome: function (target) {
    const languages = target['languages'];

    let multiplier = languages.length > 0 ? 1.0 : 0.0;
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + (Utils.getFieldWeight('languages') * multiplier));

    return target;
  }
};
const laborHoursRule = {
  validation: function (target) {
    return target['laborHours'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('laborHours'));
    return target;
  }
};
const relatedCodeNameRule = {
  validation: function (target) {
    return target['relatedCode.name'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('relatedCode.name'));
    return target;
  }
};
const relatedCodeUrlRule = {
  validation: function (target) {
    return target['relatedCode.URL'] && Utils.isValidUrl(target['relatedCode.URL']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('relatedCode.URL'));
    return target;
  }
};
const relatedCodeIsGovernmentRepoRule = {
  validation: function (target) {
    return target['relatedCode.isGovernmentRepo'];
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('relatedCode.isGovernmentRepo'));
    return target;
  }
};
const reusedCodeNameRule = {
  validation: function (target) {
    return target['reusedCode.name'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('reusedCode.name'));
    return target;
  }
};
const reusedCodeUrlRule = {
  validation: function (target) {
    return target['reusedCode.URL'] && Utils.isValidUrl(target['reusedCode.URL']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('reusedCode.URL'));
    return target;
  }
};
const partnersNameRule = {
  validation: function (target) {
    return target['partners.name'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('partners.name'));
    return target;
  }
};
const partnersEmailRule = {
  validation: function (target) {
    return target['partners.email'] && Utils.isValidEmail(target['partners.email']);
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('partners.email'));
    return target;
  }
};
const dateCreatedRule = {
  validation: function (target) {
    return target['date.created'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('date.created'));
    return target;
  }
};
const dateLastModifiedRule = {
  validation: function (target) {
    return target['date.lastModified'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('date.lastModified'));
    return target;
  }
};
const dateMetadataLastupdatedRule = {
  validation: function (target) {
    return target['date.metadataLastUpdated'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('date.metadataLastUpdated'));
    return target;
  }
};
const targetOperatingSystemsRule = {
  validation: function (target) {
    return target['target_operating_systems'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('target_operating_systems'));
    return target;
  }
};
const additionalInformationRule = {
  validation: function (target) {
    return target['additional_information'] ? true : false;
  },
  outcome: function (target) {
    target.rawScore = ((target.rawScore ? target.rawScore : 0) + Utils.getFieldWeight('additional_information'));
    return target;
  }
};

module.exports = function () {
  return [
    nameRule,
    descriptionRule,
    licenseUrlRule,
    licenseNameRule,
    usageTypeRule,
    exemptionTextRule,
    organizationRule,
    contactEmailRule,
    contactNameRule,
    contactUrlRule,
    contactPhoneRule,
    tagsRules,
    laborHoursRule,
    languagesRule,
    repositoryURLRule,
    homepageURLRule,
    downloadURLRule,
    vcsRule,
    dateCreatedRule,
    dateLastModifiedRule,
    dateMetadataLastupdatedRule,
    versionRule,
    statusRule,
    disclaimerURLRule,
    disclaimerTextRule,
    relatedCodeNameRule,
    relatedCodeUrlRule,
    relatedCodeIsGovernmentRepoRule,    
    reusedCodeNameRule,
    reusedCodeUrlRule,
    partnersNameRule,
    partnersEmailRule,
    targetOperatingSystemsRule,
    additionalInformationRule
  ];
};
