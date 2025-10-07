const SPOONACULAR_API_KEY = '0ca96dd220c842a6bfdcddfcbcf15b5d';
const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/complexSearch';
const MOCK_URL = "mockRecipe.php";

function searchRecipes(){
    let data= {
        //apiKey:SPOONACULAR_API_KEY,
        number: 5,
        addRecipeInformation: true,
        addRecipeInstructions: true,     
        addRecipeNutrition: true        
    };

    const diet = document.getElementById('recipe-diet').value;
    const cuisine = document.getElementById('recipe-cuisine').value;
    const maxReadyTime = document.getElementById('recipe-time').value;

    if (diet){
        data["diet"]= diet;
    }
    if (cuisine){
        data["cuisine"]= cuisine;
    }
    if (maxReadyTime){
        data["maxReadyTime"]= maxReadyTime;
    }

    axios.get(SPOONACULAR_URL, {params:data})
        .then(response => {
            console.log(response.data.results);

            // Save to localStorage
            localStorage.setItem('savedRecipes', JSON.stringify(response.data.results));

            displayResults(response.data.results);
        })
        .catch(error => {
            console.error('Error:', error);

            // If API fails, try to load from localStorage
            const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes'));
            if (savedRecipes) {
                console.log('Loading from localStorage');
                displayResults(savedRecipes);
            } else {
                alert('Failed to fetch recipes and no cached data available.');
            }            
        });
}

function displayResults(data){
    const recipeResults= document.getElementById("recipe-results");
    recipeResults.textContent= "";

    data.forEach(recipe=>{
        const card= document.createElement("div");
        card.className="card col-lg-4 col-12 m-3";
        card.id= recipe.id;
        card.style.width= "18rem";

        const image= document.createElement("img");
        image.src= recipe.image;
        image.addEventListener("click", (e)=>{displayInstructions(e)})

        const cardBody= document.createElement("div");
        cardBody.className="card-body";

        const cardTitle= document.createElement("h3");
        cardTitle.className= "card-title";
        cardTitle.innerText= recipe.title;
        
        const readyInMinutes= document.createElement("p");
        readyInMinutes.className="card-text";
        readyInMinutes.innerText= `${recipe.readyInMinutes} mins`;

        const aggregateLikes= document.createElement("p");
        aggregateLikes.className="card-text";
        aggregateLikes.innerText= `Number of likes: ${recipe.aggregateLikes}`;

        cardBody.append(cardTitle, readyInMinutes, aggregateLikes);
        card.append(image, cardBody);
        recipeResults.append(card);
    })
}

function displayInstructions(e){
    const modalTitle= document.getElementsByClassName("modal-title")[0];
    const modalBody= document.getElementsByClassName("modal-body")[0];

    const targetId= e.target.parentElement.id;
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes'));

    const recipe= savedRecipes.find(savedRecipe=>savedRecipe.id === Number(targetId));
    modalTitle.innerText= recipe.title;

    modalBody.textContent= "";
    const ul= document.createElement("ol");

    for (var step of recipe.analyzedInstructions[0].steps){
        const li= document.createElement("li")
        li.innerText= step.step;

        ul.append(li);
    }

    modalBody.append(ul);

    // IMPORTANT: Show the modal!
    const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
    modal.show();
}