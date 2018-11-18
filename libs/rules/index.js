const { Utils } = require('../utils');

const nameRule = {
  validation: function (target) {
    return target['name'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('name'));
    return target;
  }
};
const descriptionRule = {
  validation: function (target) {
    let isValid = false;
    if (target['description']) {
      isValid = target['description'] === target['name'] ? false : true;
    }

    isValid = target['description'].split(' ').length > 3;

    return isValid;
  },
  outcome: function (target) {
    const description = target['description'].split(' ');

    if (description.length > 30) {
      target.score = Utils.getScore(target, Utils.getFieldWeight('description'));
    } else if (description.length < 30 && description.length > 10) {
      target.score = Utils.getScore(target, 0.5);
    } else {
      target.score = Utils.getScore(target, 0.1);
    }

    return target;
  }
};
const licenseUrlRule = {
  validation: function (target) {
    if (target['permissions.licenses.URL']) {
      return Utils.isValidUrl(target['permissions.licenses.URL']);
    }
    return false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('permissions.licenses.URL'));
    return target;
  }
};
const licenseNameRule = {
  validation: function (target) {
    return target['permissions.licenses.name'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('permissions.licenses.name'));
    return target;
  }
};
const usageTypeRule = {
  validation: function (target) {
    return target['permissions.usageType'] ? true : false;
  },
  outcome: function (target) {
    const usageType = target['permissions.usageType'];

    if (usageType.toLowerCase() === 'opensource') {
      target.score = Utils.getScore(target, Utils.getFieldWeight('permissions.usageType'));
    } else if (usageType.toLowerCase() === 'governmentwidereuse') {
      target.score = Utils.getScore(target, 0.5);
    } else {
      target.score = Utils.getScore(target, 0.1);
    }

    return target;
  }
};
const exemptionTextRule = {
  validation: function (target) {
    if(target['permissions.usageType'] && target['permissions.usageType'].match(/^excempt.*/g)){
      return target['permissions.exemptionText'] ? true : false;
    }
    return false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('permissions.exemptionText'));
    return target;
  }
};
const organizationRule = {
  validation: function (target) {
    return target['organization'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('organization'));
    return target;
  }
};
const contactEmailRule = {
  validation: function (target) {
    return target['contact.email'] && Utils.isValidEmail(target['contact.email']);
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('contact.email'));
    return target;
  }
}
const contactNameRule = {
  validation: function (target) {
    return target['contact.name'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('contact.name'));
    return target;
  }
};
const contactUrlRule = {
  validation: function (target) {
    return target['contact.URL'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('contact.URL'));
    return target;
  }
};
const contactPhoneRule = {
  validation: function (target) {
    return target['contact.phone'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('contact.phone'));
    return target;
  }
};
const tagsRules = {
  validation: function (target) {
    return target['tags'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(
      target.score,
      Utils.getFieldWeight('tags') * target['tags'].length);

    return target;
  }
};
const laborHoursRule = {
  validation: function (target) {
    return target['laborHours'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('laborHours'));
    return target;
  }
};
const languagesRule = {
  validation: function (target) {
    return target['languages'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(
      target.score,
      Utils.getFieldWeight('languages') * target['languages']);

    return target;
  }
};
const repositoryURLRule = {
  validation: function (target) {
    // not only should there be a value but also a proper URL
    return target['repositoryURL'] && Utils.isValidUrl(target['repositoryURL']);
  },
  outcome: function (target) {
    let tmpScore = 0;
    if (target['permissions.usageType'] === 'openSource') {
      // we want to give more weight to open source repos
      tmpScore = Utils.getFieldWeight('repositoryURL') + 1;
    } else {
      tmpScore = Utils.getFieldWeight('repositoryURL');
    }

    target.score = Utils.getScore(target,tmpScore);
    return target;
  }
};
const homepageURLRule = {
  validation: function (target) {
    return target['homepageURL'] && Utils.isValidUrl(target['homepageURL']);
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('homepageURL'));
    return target;
  }
};
const downloadURLRule = {
  validation: function (target) {
    return target['downloadURL'] && Utils.isValidUrl(target['downloadURL']);
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('downloadURL'));
    return target;
  }
};
const vcsRule = {
  validation: function (target) {
    return target['vcs'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('vcs'));
    return target;
  }
};
const dateCreatedRule = {
  validation: function (target) {
    return target['date.created'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('date.created'));
    return target;
  }
};
const dateLastModifiedRule = {
  validation: function (target) {
    return target['date.lastModified'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('date.lastModified'));
    return target;
  }
};
const dateMetadataLastupdatedRule = {
  validation: function (target) {
    return target['date.metadataLastUpdated'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('date.metadataLastUpdated'));
    return target;
  }
};
const versionRule = {
  validation: function (target) {
    return target['version'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('version'));
    return target;
  }
};
const statusRule = {
  validation: function (target) {
    return target['status'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('status'));
    return target;
  }
};
const disclaimerURLRule = {
  validation: function (target) {
    return target['disclaimerURL'] && Utils.isValidUrl(target['disclaimerURL']);
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('disclaimerURL'));
    return target;
  }
};
const disclaimerTextRule = {
  validation: function (target) {
    return target['disclaimerText'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('disclaimerText'));
    return target;
  }
};
const relatedCodeNameRule = {
  validation: function (target) {
    return target['relatedCode.name'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('relatedCode.name'));
    return target;
  }
};
const relatedCodeUrlRule = {
  validation: function (target) {
    return target['relatedCode.URL'] && Utils.isValidUrl(target['relatedCode.URL']);
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('relatedCode.URL'));
    return target;
  }
};
const reusedCodeNameRule = {
  validation: function (target) {
    return target['reusedCode.name'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('reusedCode.name'));
    return target;
  }
};
const reusedCodeUrlRule = {
  validation: function (target) {
    return target['reusedCode.URL'] && Utils.isValidUrl(target['reusedCode.URL']);
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('reusedCode.URL'));
    return target;
  }
};
const partnersNameRule = {
  validation: function (target) {
    return target['partners.name'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('partners.name'));
    return target;
  }
};
const partnersEmailRule = {
  validation: function (target) {
    return target['partners.email'] && Utils.isValidEmail(target['partners.email']);
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('partners.email'));
    return target;
  }
};
const targetOperatingSystemsRule = {
  validation: function (target) {
    return target['target_operating_systems'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('target_operating_systems'));
    return target;
  }
};
const additionalInformationRule = {
  validation: function (target) {
    return target['additional_information'] ? true : false;
  },
  outcome: function (target) {
    target.score = Utils.getScore(target, Utils.getFieldWeight('additional_information'));
    return target;
  }
}

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
    reusedCodeNameRule,
    reusedCodeUrlRule,
    partnersNameRule,
    partnersEmailRule,
    targetOperatingSystemsRule,
    additionalInformationRule
  ];
};
