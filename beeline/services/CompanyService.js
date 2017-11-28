import assert from "assert"
import commonmark from "commonmark"

let reader = new commonmark.Parser({ safe: true })
let writer = new commonmark.HtmlRenderer({ safe: true })

export default [
  "UserService",
  "$ionicModal",
  "$rootScope",
  "$q",
  function CompanyService(UserService, $ionicModal, $rootScope, $q) {
    let companyCache = {}
    let termsScope

    return {
      getCompany: function(id, ignoreCache) {
        assert(typeof id === "number")
        if (companyCache[id] && !ignoreCache) return companyCache[id]

        return (companyCache[id] = UserService.beeline({
          url: "/companies/" + id,
          method: "GET",
        }).then(function(response) {
          return response.data
        }))
      },
      showTerms: function(id) {
        termsScope = $rootScope.$new()
        termsScope.termsModal = $ionicModal.fromTemplate(
          require("../templates/termsModal.html"),
          {
            scope: termsScope,
          }
        )

        this.getCompany(id).then(company => {
          termsScope.company = {
            termsHTML: writer.render(reader.parse(company.terms)),
          }
          termsScope.termsModal.show()
        })

        return new Promise((resolve, reject) => {
          termsScope.$on("modal.hidden", () => {
            termsScope.$destroy()
            resolve()
          })
        })
      },
    }
  },
]
